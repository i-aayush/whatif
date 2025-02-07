# Required imports at the top of the file
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import replicate
import logging
from typing import List, Dict, Any
import boto3
import os
from ..config import settings
from ..config.inference_config import (
    S3_BUCKET_NAME,
    S3_REGION,
    DEFAULT_INFERENCE_PARAMS
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=S3_REGION
)

# Import helper functions from canvas_inference
from ..routes.canvas_inference import serialize_prediction, store_images_to_s3

# Constants for prompts
gender = "f"
trigger_word = "akku"
gender_clothing = {"m": "shirtless", "f": "wearing bikini", "default": "wearing long swim shorts"}

# Predefined prompts
prompt1 = "headshot of smiling model posing with a lot of cute puppies wearing casual clothes posing for dating app headshot. indoor blurry background. the lighting is warm, possibly from a setting sun, creating a soft glow around him, enhancing the casual and relaxed vibe of the image. the setting seems to be outdoors, likely in an urban environment, with the blurred background hinting at a street or park-like area. this image likely portrays a youthful, active, and approachable individual, possibly in a lifestyle or fashion-related context."
prompt2 = "A model wearing a cozy Christmas sweater, standing by the fireplace with stockings and holiday decorations."
prompt3 = "pov photo of model seated at restaurant table across from camera, in romantic upscale setting facing camera. medium rare steak is on the table sliced into several pieces, on a wooden board, which also has a small dish of what appears to be a side condiment or salsa with chopped vegetables."
prompt4 = "professional headshot of smiling model wearing professional clothes posing for headshot. blurry indoor office background. The overall vibe of the image is one of professionalism, likely intended for a formal or business-related setting, such as a corporate headshot or a professional profile picture."
prompt5 = "TedX speaker model holding microphone with lanyard around his neck"
prompt6 = "beautiful influencer instagram model wearing elegant clothes sitting in private jet cabin, with leather interior, luxurious. champagne is on the table. outside is clouds because we are flying."
prompt7 = "model as fashion model in fashion shoot on catwalk."
prompt8 = "model as fashion model in street style shoot with diverse outfits."
prompt9 = f"the photo shows a fit {trigger_word}, {gender_clothing.get(gender, gender_clothing['default'])} happy model on the beach, playing volleyball, seemingly in preparation for a serve. model appears focused, with their gaze fixed on the ball. the background includes other beachgoers and beach equipment, but they are slightly blurred, emphasizing the model as the focal point. the model has a muscular build, with defined arms, chest, and abs. the volleyball holding is a mikasa brand, commonly used in beach volleyball. the setting suggests a warm, sunny day, perfect for beach activities."
prompt10 = "model wearing casual clothes in polaroid classic photograph posing for photo indoors"

# List of all prompts
prompts = [prompt1, prompt2, prompt3, prompt4, prompt5, 
           prompt6, prompt7, prompt8, prompt9, prompt10]

async def process_single_prompt(
    prompt: str,
    model_id: str,
    user_id: str,
    db: AsyncIOMotorClient,
    replicate_client: replicate.Client
) -> Dict[str, Any]:
    """Process a single prompt using the existing inference pipeline"""
    try:
        # Prepare inference parameters
        inference_params = {
            "prompt": prompt,
            "model_id": model_id,
            **DEFAULT_INFERENCE_PARAMS
        }
        
        # Create inference record
        inference_record = {
            "user_id": ObjectId(user_id),
            "model_id": model_id,
            "parameters": inference_params,
            "status": "processing",
            "created_at": datetime.utcnow(),
            "prompt": prompt,
            "processing_stats": {
                "start_time": datetime.utcnow().isoformat()
            },
            "is_automated": True  # Flag to identify automated inferences
        }
        
        # Insert record
        result = await db["inference_runs"].insert_one(inference_record)
        inference_id = str(result.inserted_id)
        
        # Run inference
        prediction = await replicate_client.async_run(
            model_id,
            input=inference_params
        )
        
        # Process results
        output_urls = serialize_prediction(prediction)
        
        # Upload to S3
        s3_urls = await store_images_to_s3(output_urls, user_id, inference_id)
        
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
        
        return inference_id
        
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}")
        if 'inference_id' in locals():
            await db["inference_runs"].update_one(
                {"_id": ObjectId(inference_id)},
                {"$set": {
                    "status": "failed",
                    "error": str(e),
                    "processing_stats.end_time": datetime.utcnow().isoformat()
                }}
            )
        raise

async def run_model_inferences(
    model_id: str,
    user_id: str,
    db: AsyncIOMotorClient
) -> List[str]:
    """
    Run a set of predefined inferences for a newly trained model using the existing inference pipeline
    Args:
        model_id: The Replicate model ID to use
        user_id: The user ID who owns the model
        db: Database connection
    Returns:
        List[str]: List of inference IDs for tracking
    """
    try:
        logger.info(f"Starting automated inferences for model {model_id}")
        inference_ids = []
        
        # Initialize Replicate client
        replicate_client = replicate.Client(api_token=settings.REPLICATE_API_TOKEN)
        
        # Process each prompt
        for index, prompt in enumerate(prompts):
            try:
                inference_id = await process_single_prompt(
                    prompt=prompt,
                    model_id=model_id,
                    user_id=user_id,
                    db=db,
                    replicate_client=replicate_client
                )
                inference_ids.append(inference_id)
                logger.info(f"Completed inference {index + 1}/{len(prompts)} for model {model_id}")
            except Exception as e:
                logger.error(f"Error processing prompt {index}: {str(e)}")
                continue
        
        logger.info(f"Completed all automated inferences for model {model_id}")
        return inference_ids
        
    except Exception as e:
        logger.error(f"Error in run_model_inferences: {str(e)}")
        raise





