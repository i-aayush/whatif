from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from typing import List
import boto3
import os
import replicate
from ..utils.auth import get_current_user
import zipfile
import io
import uuid
from datetime import datetime
from ..dependencies import get_db
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

BUCKET_NAME = 'whatif-genai'
REPLICATE_USERNAME = "i-aayush"  # Replace with your Replicate username

def create_replicate_model(client, model_name: str) -> str:
    """Creates a new model on Replicate if it doesn't exist."""
    try:
        # Format the full model name
        full_model_name = f"{REPLICATE_USERNAME}/{model_name}"
        
        # Create the model
        model = client.models.create(
            owner=REPLICATE_USERNAME,
            name=model_name,
            visibility="private",
            hardware="gpu-t4",  # Using H100 GPU for faster training
            description=f"Custom trained model for {model_name}"
        )
        return full_model_name
    except replicate.exceptions.ReplicateError as e:
        if "already exists" in str(e).lower():
            return f"{REPLICATE_USERNAME}/{model_name}"
        raise HTTPException(status_code=500, detail=f"Failed to create model: {str(e)}")

@router.post("/upload-and-train")
async def upload_and_train(
    request: Request,
    files: List[UploadFile] = File(...),
    model_name: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        user_id = current_user.get('_id')
        
        # Validate files
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Create a zip file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for file in files:
                content = await file.read()
                zip_file.writestr(file.filename, content)
        
        # Reset buffer position
        zip_buffer.seek(0)
        
        # Generate unique filename for the zip
        zip_filename = f"training_data/{user_id}.zip"
        
        # Upload zip to S3 with public-read access
        s3_client.upload_fileobj(
            zip_buffer,
            BUCKET_NAME,
            zip_filename,
            ExtraArgs={'ContentType': 'application/zip'}
        )
        
        # Get the S3 URL
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{zip_filename}"
        
        # Update user's model name
        result = await db["users"].update_one(
            {"_id": user_id},
            {"$set": {
                "model_name": model_name,
                "model_status": "creating"
            }}
        )
            
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        # Initialize Replicate client
        replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
        
        # Create or get the model
        destination_model = create_replicate_model(replicate_client, model_name)

        # Start training on Replicate
        training = replicate.trainings.create(
            version="ostris/flux-dev-lora-trainer:e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497",
            input={
                "steps": 2000,
                "lora_rank": 16,
                "optimizer": "adamw8bit",
                "batch_size": 1,
                "resolution": "512,768,1024",
                "autocaption": True,
                "input_images": s3_url,
                "trigger_word": model_name,
                "learning_rate": 0.0004,
                "wandb_project": "flux_train_replicate",
                "wandb_save_interval": 100,
                "caption_dropout_rate": 0.05,
                "cache_latents_to_disk": False,
                "wandb_sample_interval": 100,
                # "autocaption_prefix": f"Photo of {model_name}"
                "autocaption_suffix": f"In style of {model_name}"
            },
            destination=destination_model
        )

        # Update user's training status
        await db["users"].update_one(
            {"_id": user_id},
            {"$set": {
                "model_status": "training",
                "training_id": training.id,
                "training_started_at": datetime.utcnow()
            }}
        )

        return {
            "status": "success", 
            "training_id": training.id,
            "model_name": model_name
        }   
        
    except Exception as e:
        # Update user's model status if there's an error
        if user_id:
            await db["users"].update_one(
                {"_id": user_id},
                {"$set": {
                    "model_status": "error",
                    "error_message": str(e)
                }}
            )
        raise HTTPException(status_code=500, detail=str(e)) 