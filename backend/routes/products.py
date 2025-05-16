from fastapi import APIRouter, status, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from datetime import datetime
from bson import ObjectId
from aitrendshopper.database import shop_collection, user_collection, product_collection, cart_collection, like_collection
from aitrendshopper.config import settings
from aitrendshopper.services.generator import RecommendGenerator
from google.genai import types
import os
import shutil
from aitrendshopper.services.chathandler import Chatbot
from math import sqrt

router = APIRouter()
bot = Chatbot()
rg = RecommendGenerator(api_key=settings.gemini_api)
# Ensure the upload directory for product images exists
PRODUCT_IMAGE_DIR = "/home/hasnain/PycharmProjects/FYP/ai-fashion-trend-hub/public/assets/products_images"
os.makedirs(PRODUCT_IMAGE_DIR, exist_ok=True)

# ------------------------------
# Add Product Endpoint
# ------------------------------
@router.post("/add_product", status_code=status.HTTP_201_CREATED)
async def add_product(
background_tasks: BackgroundTasks,
    token: str = Form(...),
    product_name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    quantity: int = Form(...),
    product_image: UploadFile = File(None)
):
    try:
        # Verify the user using the token
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Ensure the user has a shop
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "User has no shop"}
        text = f"""
        shop name: {shop['shop_name']}
        shop desccription {shop['description']}
        address: {shop['address']}
        contact_number: {shop['contact_number']}
        contact_email: {shop['contact_email']}
        product_name: {product_name}
        product description: {description}
        price: {price}
        quuantity search the product on aitrendshopper to check quantity
        """
        res = await bot.update_faiss(text)
        print(res)
        image_path = None
        image_filename = None
        if product_image:
            image_filename = f"{ObjectId()}_{product_image.filename}"
            image_path = os.path.join(PRODUCT_IMAGE_DIR, image_filename)
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(product_image.file, buffer)

        product_data = {
            "_id": str(ObjectId()),
            "shop_id": shop["_id"],
            "product_name": product_name,
            "description": description,
            "price": price,
            "quantity": quantity,
            "product_image": image_filename,
            "like_count": 0,
            "created_at": datetime.utcnow().strftime("%m-%d-%Y")

        }

        await product_collection.insert_one(product_data)
        return {"status": True, "message": "Product added successfully"}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


@router.get("/get_all_products/{token}", status_code=status.HTTP_200_OK)
async def get_all_products(token: str):

    user = await user_collection.find_one({"token": token})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = str(user["_id"])

    products = await product_collection.find({}).to_list(length=100)

    # Fetch all likes for the current user at once (optimize)
    user_likes = await like_collection.find({"user_id": user_id}).to_list(length=100)
    liked_product_ids = {like["product_id"] for like in user_likes}

    # Annotate products with 'liked' field
    for product in products:
        if "_id" in product:
            product["_id"] = str(product["_id"])
            shop = await shop_collection.find_one({"_id": product["shop_id"]})
            product["shop"] = shop
            product["liked"] = product["_id"] in liked_product_ids  # True/False

    return {"status": True, "message": "Products retrieved successfully", "data": products}


# ------------------------------
# Get Specific Product Endpoint
# ------------------------------
@router.get("/get_shop_products/{token}", status_code=status.HTTP_200_OK)
async def get_product(token: str):
    try:
        # Verify the user using the token
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Get the user's shop
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "User has no shop"}

        products = await product_collection.find({"shop_id": shop["_id"]}).to_list(length=100)
        if not products:
            return {"status": False, "message": "Product not found or unauthorized"}
        for product in products:
            if "_id" in product:
                product["_id"] = str(product["_id"])
        return {"status": True, "message": "Product retrieved successfully", "data": products}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


# ------------------------------
# Delete Product Endpoint
# ------------------------------
@router.delete("/delete_product/{product_id}/{token}", status_code=status.HTTP_200_OK)
async def delete_product(product_id: str, token: str):
    try:
        # 1. Verify user
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # 2. Verify shop
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "User has no shop"}

        # 3. Delete the product itself
        delete_result = await product_collection.delete_one({
            "_id": product_id,
            "shop_id": shop["_id"]
        })
        if delete_result.deleted_count == 0:
            return {"status": False, "message": "Product not found or unauthorized"}

        # 4. Try to remove it from any carts that still reference it
        cart_update = await cart_collection.update_many(
            {"items.product_id": product_id},
            {"$pull": {"items": {"product_id": product_id}}}
        )

        # 5. Build response message based on whether any carts were modified
        if cart_update.modified_count > 0:
            msg = (
                f"Product deleted successfully "
                f"and removed from {cart_update.modified_count} cart(s)."
            )
        else:
            msg = "Product deleted successfully. It was not present in any carts."

        return {"status": True, "message": msg}

    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}

# ------------------------------
# Edit Product Endpoint
# ------------------------------
@router.put("/edit_product/{product_id}", status_code=status.HTTP_200_OK)
async def edit_product(
    product_id: str,
    token: str = Form(...),
    product_name: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    quantity: int = Form(None),
    product_image: UploadFile = File(None)
):
    try:
        # Verify the user using the token
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        # Get the user's shop
        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            return {"status": False, "message": "User has no shop"}

        # Verify that the product belongs to the shop
        product = await product_collection.find_one({"_id": product_id, "shop_id": shop["_id"]})
        if not product:
            return {"status": False, "message": "Product not found or unauthorized"}

        update_data = {}
        if product_name:
            update_data["product_name"] = product_name
        if description:
            update_data["description"] = description
        if price is not None:
            update_data["price"] = price
        if quantity is not None:
            update_data["quantity"] = quantity
        if product_image:
            image_filename = f"{ObjectId()}_{product_image.filename}"
            image_path = os.path.join(PRODUCT_IMAGE_DIR, image_filename)
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(product_image.file, buffer)
            update_data["product_image"] = image_filename

        if not update_data:
            return {"status": False, "message": "No fields provided for update"}

        await product_collection.update_one({"_id": product_id}, {"$set": update_data})
        return {"status": True, "message": "Product updated successfully"}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


# ------------------------------
# Search Product Endpoint
# ------------------------------
@router.get("/search_product/{token}", status_code=status.HTTP_200_OK)
async def search_product(token:str, query: str = Query(...)):
    try:


        user = await user_collection.find_one({"token": token})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = str(user["_id"])

        products = await product_collection.find({
            "product_name": {"$regex": query, "$options": "i"}
        }).to_list(length=100)


        # Fetch all likes for the current user at once (optimize)
        user_likes = await like_collection.find({"user_id": user_id}).to_list(length=100)
        liked_product_ids = {like["product_id"] for like in user_likes}

        # Annotate products with 'liked' field
        for product in products:
            if "_id" in product:
                product["_id"] = str(product["_id"])
                shop = await shop_collection.find_one({"_id": product["shop_id"]})
                product["shop"] = shop
                product["liked"] = product["_id"] in liked_product_ids  # True/False

        return {"status": True, "message": "Products retrieved successfully", "data": products}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}


@router.post("/toggle_like/{token}/{product_id}", status_code=status.HTTP_200_OK)
async def toggle_like(
        token: str,
        product_id: str
):
    try:
        # Verify user
        user = await user_collection.find_one({"token": token})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = str(user["_id"])

        # Find the product
        product = await product_collection.find_one({"_id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Check if already liked
        existing_like = await like_collection.find_one({"user_id": user_id, "product_id": product_id})

        if existing_like:
            # Unlike: Remove the like document and decrement like_count
            await like_collection.delete_one({"_id": existing_like["_id"]})
            await product_collection.update_one(
                {"_id": product_id},
                {"$inc": {"like_count": -1}}
            )
            action = "unliked"
        else:
            # Like: Add a like document and increment like_count
            like_data = {
                "user_id": user_id,
                "product_id": product_id
            }
            await like_collection.insert_one(like_data)
            await product_collection.update_one(
                {"_id": product_id},
                {"$inc": {"like_count": 1}}
            )
            action = "liked"

        return {"status": True, "message": f"Product successfully {action}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    denom = sqrt(sum(x*x for x in a)) * sqrt(sum(y*y for y in b))
    return (sum(x*y for x, y in zip(a, b)) / denom) if denom else 0.0

@router.get("/recommend_by_trends/{token}", status_code=status.HTTP_200_OK)
async def recommend_by_trends(
        token: str,
        top_n: int = Query(3, description="How many top-liked products to consider"),
):
    # 1) verify user exists
    user = await user_collection.find_one({"token": token})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) fetch top‐liked products
    top_products = await product_collection \
        .find({}) \
        .sort("like_count", -1) \
        .limit(top_n) \
        .to_list(length=top_n)
    if not top_products:
        return {"status": False, "message": "No products available"}
    answers = rg.recommend_trends()
    trend_resp = settings.client.models.embed_content(
        model="gemini-embedding-exp-03-07",
        contents=answers['dresses'],
        config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
    )
    trend_vecs = [e.values for e in trend_resp.embeddings]


    product_texts = [f"{p['product_name']}. {p.get('description', '')}" for p in top_products]
    prod_resp = settings.client.models.embed_content(
        model="gemini-embedding-exp-03-07",
        contents=product_texts,
        config=types.EmbedContentConfig(task_type="SEMANTIC_SIMILARITY")
    )
    prod_vecs = [e.values for e in prod_resp.embeddings]

    scores = []
    for idx, vec in enumerate(prod_vecs):
        max_score = max(cosine_similarity(vec, tvec) for tvec in trend_vecs)
        scores.append((max_score, top_products[idx]))

    # 7) sort products by descending similarity
    scores.sort(key=lambda x: x[0], reverse=True)

    # 8) build response
    recommendations = []
    for score, prod in scores:
        recommendations.append({
            'product_data':prod,
            "similarity_score": score
        })

    return {"status": True, "data": recommendations}


