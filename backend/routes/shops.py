from fastapi import APIRouter, status, HTTPException, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from aitrendshopper.database import shop_collection, user_collection
import os
import shutil

router = APIRouter()

# Ensure the upload directory for shop banners exists
SHOP_BANNER_DIR = "/home/hasnain/PycharmProjects/FYP/ai-fashion-trend-hub/public/assets/shops_images"
os.makedirs(SHOP_BANNER_DIR, exist_ok=True)


# ------------------------------
# Create Shop Endpoint
# ------------------------------
@router.post("/create_shop", status_code=status.HTTP_201_CREATED)
async def create_shop(
        token: str = Form(...),
        shop_name: str = Form(...),
        description: str = Form(...),
        address: str = Form(...),
        contact_number: str = Form(...),
        contact_email: str = Form(...),
        tagline: str = Form(...),
        shop_banner: UploadFile = File(...)
):
    try:
        # Verify that the user exists
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Check if the user already has a shop
        existing_shop = await shop_collection.find_one({"user_id": user["_id"]})
        if existing_shop:
            return {"status": False, "message": "User already has a shop"}

        # Save the shop banner image file to the designated directory
        banner_filename = f"{ObjectId()}_{shop_banner.filename}"
        banner_path = os.path.join(SHOP_BANNER_DIR, banner_filename)
        with open(banner_path, "wb") as buffer:
            shutil.copyfileobj(shop_banner.file, buffer)

        # Create the shop record with the creation date in MM-DD-YYYY format
        shop_data = {
            "_id": str(ObjectId()),
            "user_id": user["_id"],
            "shop_name": shop_name,
            "description": description,
            "address": address,
            "contact_number": contact_number,
            "contact_email": contact_email,
            "tagline": tagline,
            "shop_banner": banner_filename,
            "created_at": datetime.utcnow().strftime("%m-%d-%Y")
        }

        await shop_collection.insert_one(shop_data)
        return {"status": True, "message": "Shop created successfully"}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


# ------------------------------
# Get Shop Detail Endpoint
# ------------------------------
@router.get("/get_shop/{token}", status_code=status.HTTP_200_OK)
async def get_shop(token: str):
    try:
        # Verify that the user exists
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Fetch the shop to ensure it belongs to the current user
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "Shop not found or unauthorized"}

        return {"status": True, "message": "Shop details retrieved successfully", "data": shop}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


# ------------------------------
# Edit Shop Endpoint
# ------------------------------
@router.put("/edit_shop", status_code=status.HTTP_200_OK)
async def edit_shop(
        token: str = Form(...),
        shop_name: str = Form(None),
        description: str = Form(None),
        address: str = Form(None),
        contact_number: str = Form(None),
        contact_email: str = Form(None),
        tagline: str = Form(None),
        shop_banner: UploadFile = File(None)
):
    try:
        # Verify that the user exists
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Fetch the shop to ensure it belongs to the current user
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "Shop not found or unauthorized"}

        update_data = {}
        if shop_name:
            update_data["shop_name"] = shop_name
        if description:
            update_data["description"] = description
        if address:
            update_data["address"] = address
        if contact_number:
            update_data["contact_number"] = contact_number
        if contact_email:
            update_data["contact_email"] = contact_email
        if tagline:
            update_data["tagline"] = tagline
        if shop_banner:
            # Save the new shop banner image file
            banner_filename = f"{ObjectId()}_{shop_banner.filename}"
            banner_path = os.path.join(SHOP_BANNER_DIR, banner_filename)
            with open(banner_path, "wb") as buffer:
                shutil.copyfileobj(shop_banner.file, buffer)
            update_data["shop_banner"] = banner_filename

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        await shop_collection.update_one({"user_id": user['_id']}, {"$set": update_data})
        return {"status": True, "message": "Shop updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
