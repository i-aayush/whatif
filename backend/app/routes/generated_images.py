from fastapi import APIRouter, Depends, HTTPException
from ..dependencies import get_db
from ..utils.auth import get_current_user
from ..models.user import User
from ..models.user_image import UserImageInDB, UserImageResponse
from typing import List
from bson import ObjectId
from pydantic import BaseModel

class GenerateImageRequest(BaseModel):
    prompt: str
    image_urls: List[str]

router = APIRouter()

@router.post("/", response_model=UserImageResponse)
async def save_generated_images(
    request: GenerateImageRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Save generated images for a user"""
    user_image = UserImageInDB(
        prompt=request.prompt,
        image_urls=request.image_urls,
        user_id=str(current_user.id)
    )
    
    result = await db["user_images"].insert_one(user_image.dict(by_alias=True))
    
    # Fetch the created image document
    created_image = await db["user_images"].find_one({"_id": result.inserted_id})
    return created_image

@router.get("/user/{user_id}", response_model=List[UserImageResponse])
async def get_user_generated_images(
    user_id: str,
    db = Depends(get_db)
):
    """Get all generated images for a user"""
    images = await db["user_images"].find({"user_id": user_id}).to_list(length=None)
    return images

@router.get("/{image_id}", response_model=UserImageResponse)
async def get_generated_image(
    image_id: str,
    db = Depends(get_db)
):
    """Get a specific generated image"""
    if (image := await db["user_images"].find_one({"_id": ObjectId(image_id)})) is not None:
        return image
    raise HTTPException(status_code=404, detail="Generated image not found") 