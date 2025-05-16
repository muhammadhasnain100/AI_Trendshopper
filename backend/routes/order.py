from fastapi import APIRouter, status, HTTPException, Form, Query, Path
from datetime import datetime
from bson import ObjectId
from aitrendshopper.database import (
    user_collection,
    shop_collection,
    product_collection,
    order_collection,
    cart_collection,
)

router = APIRouter()

@router.post("/checkout", status_code=status.HTTP_200_OK)
async def checkout(token: str = Form(...)):
    """
    Buyer places an order:
    - verifies stock
    - decrements inventory
    - stamps shop_id, status="pending"
    """
    try:
        user = await user_collection.find_one({"token": token})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["_id"]
        cart = await cart_collection.find_one({"user_id": user_id})
        if not cart or not cart.get("items"):
            raise HTTPException(status_code=400, detail="Cart is empty")

        order_items = []
        total_amount = 0.0
        # assume cart only contains items from one shop; grab that shop_id
        # if mixed—shop_orders endpoint will filter per-item
        for item in cart["items"]:
            product = await product_collection.find_one({"_id": item["product_id"]})
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
            if product["quantity"] < item["quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for product {product['product_name']}"
                )

            amount = product["price"] * item["quantity"]
            total_amount += amount
            order_items.append({
                "shop_id": product["shop_id"],
                "product_id": product["_id"],
                "product_name": product["product_name"],
                "quantity": item["quantity"],
                "price": product["price"],
                "amount": amount,
            })

        # decrement stock
        for item in cart["items"]:
            await product_collection.update_one(
                {"_id": item["product_id"]},
                {"$inc": {"quantity": -item["quantity"]}}
            )

        # pick a shop_id if you want a single one at top‐level:
        shop_id = order_items[0]["shop_id"]

        order_data = {
            "_id": str(ObjectId()),
            "user_id": user_id,
            "shop_id": shop_id,
            "items": order_items,
            "total_amount": total_amount,
            "status": "pending",                     # new!
            "ordered_at": datetime.utcnow().strftime("%m-%d-%Y")
        }
        await order_collection.insert_one(order_data)

        # clear cart
        await cart_collection.update_one(
            {"_id": cart["_id"]},
            {"$set": {"items": []}}
        )

        return {"status": True, "message": "Order placed successfully", "order": order_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders/{token}", status_code=status.HTTP_200_OK)
async def get_user_orders(token: str = Path(...)):
    """
    Buyer can list all their orders.
    """
    try:
        user = await user_collection.find_one({"token": token})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["_id"]
        orders_cursor = order_collection.find({"user_id": user_id})
        orders = []
        async for o in orders_cursor:
            o["_id"] = str(o["_id"])
            orders.append(o)

        if not orders:
            return {"status": False, "message": "No orders found for this user"}
        return {"status": True, "orders": orders}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shop_orders/{token}", status_code=status.HTTP_200_OK)
async def get_orders_for_shop_owner(token: str = Path(...)):
    """
    Shop owner lists all orders that include *their* products.
    Only the items belonging to their shop are returned per order.
    """
    try:
        user = await user_collection.find_one({"token": token})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found for this user")

        shop_id = shop["_id"]
        # query any order containing >=1 item from this shop
        cursor = order_collection.find({"items.shop_id": shop_id})
        shop_orders = []
        async for o in cursor:
            o["_id"] = str(o["_id"])
            # filter items to this shop only
            filtered_items = [i for i in o["items"] if i["shop_id"] == shop_id]
            shop_orders.append({
                "order_id": o["_id"],
                "buyer_id": str(o["user_id"]),
                "items": filtered_items,
                "status": o.get("status", "pending"),
                "ordered_at": o.get("ordered_at")
            })

        if not shop_orders:
            return {"status": False, "message": "No orders found for your shop"}
        return {"status": True, "orders": shop_orders}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/orders/{order_id}/complete/{token}", status_code=status.HTTP_200_OK)
async def complete_order_by_buyer(
    order_id: str,
    token: str
):

    user = await user_collection.find_one({"token": token})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    oid = ObjectId(order_id)
    order = await order_collection.find_one({"_id": str(oid)})
    print(order)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to complete this order")
    if order.get("status") == "completed":
        return {"status": False, "message": "Order is already completed"}

    await order_collection.update_one(
        {"_id": oid},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.utcnow().strftime("%m-%d-%Y")
        }}
    )
    return {"status": True, "message": "Order marked as completed"}

