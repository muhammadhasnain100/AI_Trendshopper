from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client_db = AsyncIOMotorClient(settings.MONGO_DETAILS, serverSelectionTimeoutMS=5000)
database = client_db.user_db
user_collection = database.users
shop_collection = database.shops
product_collection = database.products
order_collection = database.order
cart_collection = database.cart
marketing_collection = database.marketing_agent
chats_collection = database.chats
like_collection = database.likes
