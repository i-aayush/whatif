from fastapi import APIRouter, Depends, HTTPException
from ..models.user import User
from ..dependencies import  get_db
from ..utils.auth import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current user's profile"""
    return current_user

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    db = Depends(get_db)
):
    """Get a user by ID"""
    if (user := await db["users"].find_one({"_id": ObjectId(user_id)})) is not None:
        return user
    raise HTTPException(status_code=404, detail="User not found") 