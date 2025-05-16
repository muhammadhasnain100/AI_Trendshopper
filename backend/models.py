from pydantic import BaseModel, EmailStr, Field
from typing import Optional,List

class SignupUser(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

class Login(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    credential: Optional[str] = None


class GetUserDetails(BaseModel):
    token: str

class EditProfile(BaseModel):
    token: str
    name: str = None
    phone_number: str = None
    address: str = None

class TrendsRequest(BaseModel):
    gender: str
    dress_type: str
    occasion: str
    region: Optional[str] = "Pakistan"

class ImageRequest(BaseModel):
    trend_description: str
    gender: str
    occasion: str
    dress_type: str

class ChatRequest(BaseModel):
    token: str
    query: str
    search: bool


