from fastapi import APIRouter, status, HTTPException, Query
from aitrendshopper.database import (
    shop_collection,
    user_collection,
    product_collection,
    order_collection,
)

router = APIRouter()
@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def dashboard(token: str = Query(...)):
    try:
        user = await user_collection.find_one({"token": token})
        if not user:
            return {"status": False, "message": "User not found"}

        shop = await shop_collection.find_one({"user_id": user["_id"]})
        if not shop:
            raise HTTPException(status_code=404, detail="User has no shop")
        shop_id = shop["_id"]

        # Get orders for the shop
        orders_cursor = order_collection.find({"shop_id": shop_id})
        orders = await orders_cursor.to_list(length=100)
        total_sales = sum(order.get("total_amount", 0) for order in orders)
        total_orders = len(orders)

        # Get current inventory for shop products
        products_cursor = product_collection.find({"shop_id": shop_id})
        products = await products_cursor.to_list(length=100)

        dashboard_data = {
            "total_sales": total_sales,
            "total_orders": total_orders,
            "orders": orders,
            "products": products
        }
        return {"status": True, "message": "Dashboard data retrieved successfully", "data": dashboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while retrieving dashboard data: {str(e)}")