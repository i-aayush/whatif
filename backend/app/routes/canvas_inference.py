from fastapi import APIRouter, HTTPException, Depends, Request, status
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import replicate
import os
import logging
import boto3
import requests
from io import BytesIO
from ..utils.auth import get_current_user
from ..dependencies import get_db
from ..config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name='us-east-1'
)

BUCKET_NAME = 'whatif-genai'

router = APIRouter()

def download_image(url: str) -> BytesIO:
    """Download image from URL to memory buffer"""
    try:
        response = requests.get(url, stream=True, verify=True)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx, 5xx)
        return BytesIO(response.content)
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download image: {str(e)}")

async def store_images_to_s3(urls: list, user_id: str, inference_id: str) -> list:
    """Store multiple images to S3 and return their URLs"""
    s3_urls = []
    for i, url in enumerate(urls):
        try:
            # Download image from Replicate
            image_data = download_image(url)
            
            # Reset buffer position
            image_data.seek(0)
            
            # Generate S3 key with partitioning
            key = f"inference_data/{user_id}/{inference_id}/image_{i}.png"
            
            # Upload to S3 with public-read access
            s3_client.upload_fileobj(
                image_data,
                BUCKET_NAME,
                key,
                ExtraArgs={'ContentType': 'image/png'}
            )
            
            # Generate S3 URL
            s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"
            logger.info(f"Uploaded image to S3: {s3_url}")
            s3_urls.append(s3_url)
            
        except Exception as e:
            logger.error(f"Error processing image {i}: {str(e)}")
            continue
    return s3_urls

def serialize_prediction(prediction):
    """Helper function to serialize Replicate prediction output"""
    if isinstance(prediction, list):
        return [p.url if hasattr(p, 'url') else str(p) for p in prediction]
    elif hasattr(prediction, 'url'):
        return [prediction.url]
    else:
        return [str(prediction)]

@router.post("/inference")
async def create_inference(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        # Get request data
        data = await request.json()
        user_id = current_user.get('_id')
        prompt = data.get('prompt', '')
        logger.info(f"Creating inference for user {user_id} with prompt: {prompt}")
        
        # Get model_id from request
        model_id = data.get('model_id')
        if not model_id:
            model_id = "black-forest-labs/flux-1.1-pro"  # fallback default
        logger.info(f"Selected model: {model_id}")

        # Initialize Replicate client
        logger.info("Initializing Replicate client")
        replicate_client = replicate.Client(api_token=settings.REPLICATE_API_TOKEN)

        # Prepare inference parameters
        inference_params = {
            "prompt": data.get('prompt'),
            "prompt_upsampling": True,
            "num_outputs": data.get('num_outputs', 1),
            "guidance_scale": data.get('guidance_scale', 3.0),
            "prompt_strength": data.get('prompt_strength', 0.96),
            "num_inference_steps": data.get('num_inference_steps', 41),
            "output_quality": data.get('output_quality', 100)
        }

        # Remove None values from parameters
        inference_params = {k: v for k, v in inference_params.items() if v is not None}
        logger.info(f"Inference parameters prepared: {inference_params}")

        # Create initial inference record
        inference_record = {
            "user_id": user_id,
            "model_id": model_id,
            "parameters": inference_params,
            "status": "processing",
            "created_at": datetime.utcnow(),
            "prompt": prompt,
            "processing_stats": {
                "start_time": datetime.utcnow().isoformat()
            }
        }
        
        # Insert record and get ID
        result = await db["inference_runs"].insert_one(inference_record)
        inference_id = str(result.inserted_id)
        logger.info(f"Created inference record with ID: {inference_id}")

        # Run inference asynchronously using the selected model
        logger.info(f"Starting async inference with model: {model_id}")
        prediction = await replicate_client.async_run(
            model_id,
            input=inference_params
        )
        
        # Process results
        output_urls = serialize_prediction(prediction)
        logger.info(f"Received prediction output: {output_urls}")

        # Upload to S3
        s3_urls = await store_images_to_s3(output_urls, str(user_id), inference_id)

        # Calculate processing time
        end_time = datetime.utcnow()
        start_time = datetime.fromisoformat(inference_record["processing_stats"]["start_time"])
        total_time = (end_time - start_time).total_seconds()

        # Update record with results
        await db["inference_runs"].update_one(
            {"_id": ObjectId(inference_id)},
            {"$set": {
                "status": "completed",
                "replicate_urls": output_urls,
                "output_urls": s3_urls,
                "completed_at": end_time,
                "processing_stats.end_time": end_time.isoformat(),
                "processing_stats.total_time_seconds": total_time
            }}
        )

        return {
            "status": "success",
            "inference_id": inference_id,
            "output_urls": s3_urls
        }

    except Exception as e:
        logger.error(f"Error in create_inference: {str(e)}", exc_info=True)
        if 'inference_id' in locals():
            await db["inference_runs"].update_one(
                {"_id": ObjectId(inference_id)},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "processing_stats.end_time": datetime.utcnow().isoformat()
                }}
            )
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inferences")
async def get_inferences(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db),
    page: int = 0,
    limit: int = 20
):
    try:
        user_id = current_user.get('_id')
        logger.info(f"Fetching inferences for user: {user_id}, page: {page}, limit: {limit}")
        
        # Calculate skip for pagination
        skip = page * limit
        
        # Get inferences sorted by creation date
        cursor = db["inference_runs"].find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        inference_runs = await cursor.to_list(length=None)
        
        # Get total count for pagination
        total_count = await db["inference_runs"].count_documents({"user_id": user_id})
        
        # Convert ObjectId to string for JSON serialization
        formatted_inferences = []
        for run in inference_runs:
            formatted_inferences.append({
                "_id": str(run["_id"]),
                "inference_id": str(run["_id"]),
                "user_id": str(run["user_id"]),
                "status": run.get("status"),
                "prompt": run.get("prompt", ""),
                "parameters": run.get("parameters", {}),
                "output_urls": run.get("output_urls", []),
                "created_at": run.get("created_at", "")
            })
            
        logger.info(f"Found {len(formatted_inferences)} inference runs")
        return {
            "inferences": formatted_inferences,
            "total": total_count,
            "page": page,
            "has_more": (skip + limit) < total_count
        }

    except Exception as e:
        logger.error(f"Error fetching inferences: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inference/{inference_id}")
async def get_inference(
    inference_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        logger.info(f"Fetching inference {inference_id}")
        inference = await db["inference_runs"].find_one({"_id": ObjectId(inference_id)})
        
        if not inference:
            logger.warning(f"Inference {inference_id} not found")
            raise HTTPException(status_code=404, detail="Inference not found")
        
        # Convert ObjectId to string for JSON serialization
        inference["_id"] = str(inference["_id"])
        inference["user_id"] = str(inference["user_id"])
        
        return inference
        
    except Exception as e:
        logger.error(f"Error fetching inference: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feed")
async def get_feed_examples(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db),
    page: int = 0,
    limit: int = 20
):
    try:
        logger.info(f"Fetching feed examples, page: {page}, limit: {limit}")
        
        # Calculate skip for pagination
        skip = page * limit
        
        # Get feed examples sorted by creation date with specific fields
        cursor = db["feed"].find(
            {},
            {
                "_id": 1,
                "prompt": 1,
                "created_at": 1,
                "s3_url": 1  # Make sure this matches your field name in MongoDB
            }
        ).sort("created_at", -1).skip(skip).limit(limit)
        feed_examples = await cursor.to_list(length=None)
        
        # Get total count for pagination
        total_count = await db["feed"].count_documents({})
        
        # Convert ObjectId to string and format response
        formatted_examples = []
        for example in feed_examples:
            formatted_examples.append({
                "_id": str(example["_id"]),
                "prompt": example.get("prompt", ""),
                "created_at": example.get("created_at", ""),
                "output_urls": [example.get("s3_url")] if example.get("s3_url") else []
            })
            
        logger.info(f"Found {len(formatted_examples)} feed examples")
        return {
            "examples": formatted_examples,
            "total": total_count,
            "page": page,
            "has_more": (skip + limit) < total_count
        }

    except Exception as e:
        logger.error(f"Error fetching feed examples: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 