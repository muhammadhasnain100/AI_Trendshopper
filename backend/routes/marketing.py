from fastapi import APIRouter, BackgroundTasks
from fastapi import HTTPException, Response

from aitrendshopper.services.marketing_agent import MarketingBot
from aitrendshopper.database import product_collection, shop_collection, marketing_collection
bot = MarketingBot()
router = APIRouter()

@router.post("/start-campaign/{product_id}")
async def start_campaign_endpoint(background_tasks: BackgroundTasks, product_id: str):
    """
    Start the marketing campaign in the background.
    """
    try:
        # Check if a campaign for the product already exists.
        marketing = await marketing_collection.find_one({"product_id": product_id})
        if marketing:
            return {"status": False, "message": "Campaign already done"}
        # Fetch product and shop details.
        product = await product_collection.find_one({"_id": product_id})
        if not product:
            return {"status": False, "message": "Product not found"}
        shop = await shop_collection.find_one({"_id": product.get("shop_id")})
        if not shop:
            return {"status": False, "message": "Shop not found"}

        # Run the campaign in the background so that the endpoint returns immediately.
        background_tasks.add_task(bot.start_campaign, product, shop)
        return {"status": True, "message": "Campaign started successfully in the background."}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}

@router.get("/check-result/{product_id}")
async def check_result_endpoint(product_id: str):
    """
    Check the marketing campaign result for a given product_id.
    """
    try:
        result = await bot.get_result(product_id)

        if not result:
            return {"status": False, "message": "No campaign found for the provided product"}

        return {"status": True, "message": "campaign found for the provided product", "campaign_result": result}
    except Exception as e:
        return {"status": False, "message": f"An error occurred: {str(e)}"}

@router.get("/product-poster/{product_id}")
async def product_poster_endpoint(product_id: str):

    try:
        marketing = await marketing_collection.find_one({"product_id": product_id})

        img_bytes = marketing.get('image')
        if not img_bytes:
            raise HTTPException(status_code=500, detail="Image generation returned no data")
        return Response(content=img_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {exc}")

@router.get("/marketing-status/{product_id}")
async def marketing_status_endpoint(product_id: str):
    marketing = await marketing_collection.find_one({"product_id": product_id})
    if marketing:
        return {"status": True, "message": "Campaign already done"}
    else:
         return {"status": False, "message": "Campaign not done"}


