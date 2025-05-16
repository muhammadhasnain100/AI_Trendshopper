from fastapi import APIRouter, HTTPException, Response
from aitrendshopper.services.generator import ImageGenerator
from aitrendshopper.config import settings
from aitrendshopper.models import TrendsRequest, ImageRequest

router = APIRouter()
ig = ImageGenerator(api_key=settings.gemini_api)

@router.post("/trends")
async def get_trends(request: TrendsRequest):
    try:
        result = ig.recommend_trends(
            gender=request.gender,
            dress_type=request.dress_type,
            occasion=request.occasion,
            region=request.region,
        )
        return {
            "status":True,
            "message":"Trends fetched successfully",
            "data":result
        }
    except Exception as exc:
        return {
            "status": False,
            "message": "Trends fetched unsuccessfully"}

@router.post("/image")
async def get_image(request: ImageRequest):
    try:
        img_bytes = ig.generate_image(
            dress_type=request.dress_type,
            trend_description=request.trend_description,
            gender=request.gender,
            occasion=request.occasion,
        )
        if not img_bytes:
            raise HTTPException(status_code=500, detail="Image generation returned no data")
        return Response(content=img_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {exc}")
