from fastapi import APIRouter, status, HTTPException, Form, Query
from bson import ObjectId
from aitrendshopper.database import (
    user_collection,
    product_collection,
    cart_collection,
)
router = APIRouter()

@router.post("/add_to_cart", status_code=status.HTTP_200_OK)
async def add_to_cart(
        token: str = Form(...),
        product_id: str = Form(...),
        quantity: int = Form(...)
):
    try:
        # Verify that the user exists
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        user_id = user["_id"]
        product = await product_collection.find_one({"_id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        cart = await cart_collection.find_one({"user_id": user_id})
        if not cart:
            cart = {
                "_id": str(ObjectId()),
                "user_id": user_id,
                "items": []
            }
            await cart_collection.insert_one(cart)

        # Add or update product in cart
        found = False
        for item in cart["items"]:
            if item["product_id"] == product_id:
                item["quantity"] += quantity
                found = True
                break
        if not found:
            cart["items"].append({"product_id": product_id, "quantity": quantity})

        await cart_collection.update_one({"_id": cart["_id"]}, {"$set": {"items": cart["items"]}})
        return {"status": True, "message": "Product added to cart successfully", "cart": cart}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding to cart: {str(e)}")


@router.get("/get_cart", status_code=status.HTTP_200_OK)
async def get_cart(token: str = Query(...)):
    try:
        # Verify that the user exists
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        cart = await cart_collection.find_one({"user_id": user["_id"]})
        if not cart:
            return {"status": True, "message": "Cart is empty", "cart": []}

        enriched_items = []
        for item in cart["items"]:
            product = await product_collection.find_one({"_id": item["product_id"]})
            if product:
                product["ordered_quantity"] = item["quantity"]
                enriched_items.append(product)
        return {"status": True, "message": "Cart retrieved successfully", "cart": enriched_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while retrieving cart: {str(e)}")


@router.delete("/remove_from_cart", status_code=status.HTTP_200_OK)
async def remove_from_cart(token: str = Query(...), product_id: str = Query(...)):
    try:
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        cart = await cart_collection.find_one({"user_id": user["_id"]})
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        new_items = [item for item in cart["items"] if item["product_id"] != product_id]
        await cart_collection.update_one({"_id": cart["_id"]}, {"$set": {"items": new_items}})
        return {"status": True, "message": "Product removed from cart successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while removing from cart: {str(e)}")
