from fastapi import APIRouter, status, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
from jose import jwt, JWTError
from aitrendshopper.models import SignupUser, Login, GetUserDetails, EditProfile
from aitrendshopper.database import user_collection
from aitrendshopper.auth import hash_password, create_access_token, verify_password
from aitrendshopper.help import get_user_by_email
from aitrendshopper.services.emailauth import verify_email_smtp
from aitrendshopper.config import settings

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_data: SignupUser):
    if user_data.password and user_data.password != user_data.confirm_password:
        return {'status': False, "message": "Passwords do not match"}
    # status_email = verify_email_smtp(user_data.email)
    status_email = True
    if status_email:
        existing_user = await user_collection.find_one({"email": user_data.email})
        if existing_user:
            return {'status': False, "message": 'User with this email already exists'}

        hashed_password = await hash_password(user_data.password) if user_data.password else None

        # Set joining_date to current UTC time during signup
        new_user = {
            "_id": str(ObjectId()),
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "token": None,
            "address": None,
            "phone_number": None,
            "joining_date": datetime.utcnow().strftime("%m-%d-%Y")
        }

        await user_collection.insert_one(new_user)
        return {"status": True, "message": "User registered successfully"}
    else:
        return {"status": False, "message": "Your provided email does not exist or incorrect"}


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(data: Login):
    try:
        if data.credential:
            try:
                # Google login
                from google.auth.transport.requests import Request
                from google.oauth2.id_token import verify_oauth2_token

                user_info = verify_oauth2_token(data.credential, Request(), settings.GOOGLE_CLIENT_ID)
                email = user_info['email']
                name = user_info['name']

                # Check if the user exists
                user = await get_user_by_email(email)
                if not user:
                    token_data = {
                        "sub": email,
                        "exp": datetime.utcnow() + timedelta(hours=1)
                    }
                    token = await create_access_token(token_data)
                    new_user = {
                        "_id": str(ObjectId()),
                        "name": name,
                        "email": email,
                        "password": None,  # No password needed for Google login
                        "token": token,
                        "address": None,
                        "phone_number": None,
                        "joining_date": datetime.utcnow().strftime("%m-%d-%Y")
                    }
                    await user_collection.insert_one(new_user)
                    return {"status": True, "message": "New user created and logged in successfully", "token": token}

                token_data = {
                    "sub": email,
                    "exp": datetime.utcnow() + timedelta(hours=1)
                }
                token = await create_access_token(token_data)
                await user_collection.update_one({"email": email}, {"$set": {"token": token}})
                return {"status": True, "message": "Login successful", "token": token}

            except jwt.JWTError:
                return {"status": False, "message": "Invalid Google authentication token"}

        if data.email and data.password:
            user = await get_user_by_email(data.email)
            if not user:
                return {"status": False, "message": "Invalid credentials"}

            if not await verify_password(data.password, user['password']):
                return {"status": False, "message": "Invalid email or password"}

            token_data = {
                "sub": user["email"],
                "exp": datetime.utcnow() + timedelta(hours=1)
            }
            token = await create_access_token(token_data)
            await user_collection.update_one({"email": user["email"]}, {"$set": {"token": token}})
            return {"status": True, "message": "Login successful", "token": token}

        return {"status": False, "message": "Invalid login credentials"}
    except Exception as e:
        return {"status": False, "message": "An error occurred during login"}


@router.get("/get_user_details/{token}", status_code=status.HTTP_200_OK)
async def get_user_details(token: str):
    try:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email:
                return {"status": False, "message": "Invalid token"}
        except JWTError:
            return {"status": False, "message": "Invalid token"}

        user = await user_collection.find_one({"email": email})
        if not user:
            return {"status": False, "message": "User not found"}

        for field in ["token", "password"]:
            user.pop(field, None)
        return {"status": True, "message": "User details retrieved successfully", "data": user}
    except Exception as e:
        return {"status": False, "message": "An error occurred while retrieving user details"}

@router.put("/edit_profile", status_code=status.HTTP_200_OK)
async def edit_profile(data: EditProfile):

    try:
        try:
            payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email:
                return {"status": False, "message": f"Invalid token"}
        except JWTError:
            return {"status": False, "message": f"Invalid token"}

        # Find the user in the database
        user = await user_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = {}
        if data.name:
            update_data["name"] = data.name
        if data.phone_number:
            update_data["phone_number"] = data.phone_number
        if data.address:
            update_data["address"] = data.address


        if update_data:
            await user_collection.update_one({"email": email}, {"$set": update_data})
            return {"status": True, "message": "Profile updated successfully"}
        else:
            return {"status": False, "message": "No fields provided for update"}
    except Exception as e:
        return {"status": False, "message": f"An error occurred while updating profile"}
