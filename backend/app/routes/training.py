from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request, BackgroundTasks, Query
from typing import List
import boto3
import os
import replicate
from ..utils.auth import get_current_user
from ..utils.db import get_background_db_client
import zipfile
import io
import uuid
from datetime import datetime
import asyncio
from ..dependencies import get_db
from motor.motor_asyncio import AsyncIOMotorClient
from botocore.config import Config
import logging
import tempfile
import shutil
from pathlib import Path
import json
from ..config.config import settings
from bson.objectid import ObjectId
from ..utils.prompt_inferences import run_model_inferences

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Remove the module-level database client
# Instead, create a function to get a fresh background client when needed
async def get_training_db():
    """Get a fresh database client for training operations"""
    client = get_background_db_client()
    return client[settings.DB_NAME]

# Initialize S3 client with retry configuration
s3_config = Config(
    region_name='us-east-1',
    retries = dict(
        max_attempts = 3,
        mode = 'adaptive'
    ),
    connect_timeout=900,
    read_timeout=900,
    max_pool_connections=50
)

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    config=s3_config,
    verify=True  # Ensure SSL verification is enabled
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

async def update_error_status(db_client, training_id: str, user_id: str, error_message: str):
    """Helper function to update error status in database"""
    try:
        # Update training run
        await db_client["whatif"]["training_runs"].update_one(
            {"training_id": training_id},
            {"$set": {
                "status": "error",
                "error": error_message,
                "completed_at": datetime.utcnow()
            }}
        )
        
        # Update user status
        await db_client["whatif"]["users"].update_one(
            {"_id": user_id},
            {"$set": {
                "model_status": "error",
                "current_training_id": None,
                "last_error": error_message
            }}
        )
    except Exception as e:
        logger.error(f"Failed to update error status in database: {str(e)}")

async def poll_training_status(training_id: str, user_id: str, replicate_client: replicate.Client, db_client: AsyncIOMotorClient):
    """Poll training status and update database"""
    try:
        training = replicate_client.trainings.get(training_id)
        
        while training.status not in ["succeeded", "failed", "canceled"]:
            await asyncio.sleep(60)  # Check every minute
            training = replicate_client.trainings.get(training_id)
            logger.info(f"Training status for {training_id}: {training.status}")

        logger.info(f"Training completed with status: {training.status}")
        
        if training.status == "succeeded":
            # Get the trained model version
            model_version = training.version
            
            # Update training run status
            await db_client["training_runs"].update_one(
                {"training_id": training_id},
                {"$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "model_version": model_version.id if model_version else None
                }}
            )
            
            # Update user's model information
            await db_client["users"].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "model_status": "completed",
                    "current_training_id": None
                }}
            )
            
            # Run automated inferences if training succeeded
            try:
                logger.info(f"Starting automated inferences for model {model_version.id}")
                inference_ids = await run_model_inferences(
                    model_id=model_version.id,
                    user_id=user_id,
                    db=db_client
                )
                logger.info(f"Completed automated inferences, count: {len(inference_ids)}")
                
                # Update training run with inference IDs
                await db_client["training_runs"].update_one(
                    {"training_id": training_id},
                    {"$set": {
                        "automated_inference_ids": inference_ids,
                        "automated_inference_count": len(inference_ids)
                    }}
                )
            except Exception as e:
                logger.error(f"Error running automated inferences: {str(e)}")
                # Don't raise the exception - we don't want to mark the training as failed
                
        else:
            # Update status for failed or canceled training
            await db_client["training_runs"].update_one(
                {"training_id": training_id},
                {"$set": {
                    "status": "failed" if training.status == "failed" else "canceled",
                    "completed_at": datetime.utcnow(),
                    "error": training.error if training.status == "failed" else "Training was canceled"
                }}
            )
            
            # Update user's model status
            await db_client["users"].update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "model_status": "failed" if training.status == "failed" else "canceled",
                    "current_training_id": None
                }}
            )
            
    except Exception as e:
        logger.error(f"Error in poll_training_status: {str(e)}")
        # Update training run status
        await db_client["training_runs"].update_one(
            {"training_id": training_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "completed_at": datetime.utcnow()
            }}
        )
        
        # Update user's model status
        await db_client["users"].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "model_status": "failed",
                "current_training_id": None
            }}
        )

async def save_upload_file_tmp(upload_file: UploadFile) -> str:
    """Saves an upload file temporarily and returns the path"""
    try:
        suffix = os.path.splitext(upload_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            # Read and write in chunks of 1MB
            chunk_size = 2048 * 1024  # 1MB
            while chunk := await upload_file.read(chunk_size):
                tmp.write(chunk)
            return tmp.name
    except Exception as e:
        logger.error(f"Error saving temporary file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

async def upload_and_train(
    files: List[UploadFile],
    model_name: str,
    current_user: dict,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorClient = Depends(get_db)
):
    """Handle file upload and start training process"""
    logger.info(f"Starting upload and train process for user {current_user['_id']} with model name {model_name}")
    temp_files = []
    training_id = None
    db_error = None
    background_db = None

    try:
        # Create zip file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Process each file
            for file in files:
                # Create a temporary file with the original filename
                temp_path = os.path.join(tempfile.gettempdir(), file.filename)
                temp_files.append(temp_path)
                
                # Read content and save to temp file
                content = await file.read()
                with open(temp_path, "wb") as f:
                    f.write(content)
                logger.info(f"Saved temporary file: {temp_path} with original name: {file.filename}")
                
                # Add to zip with original filename
                zip_file.write(temp_path, file.filename)
                logger.info(f"Added to zip: {file.filename}")

        # Get zip file size and log contents
        zip_size = zip_buffer.tell()
        zip_buffer.seek(0)
        logger.info(f"Compressed zip size: {zip_size / (1024*1024):.2f} MB")
        
        # Log zip contents for verification
        verify_buffer = io.BytesIO(zip_buffer.getvalue())
        with zipfile.ZipFile(verify_buffer) as verify_zip:
            logger.info("Zip contents:")
            for info in verify_zip.filelist:
                logger.info(f"- {info.filename} (size: {info.file_size} bytes)")

        # Generate unique filename for S3
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        s3_key = f"training_data/{current_user['_id']}_{timestamp}.zip"
        logger.info(f"Generated zip filename: {s3_key}")

        # Upload to S3
        zip_buffer.seek(0)
        s3_client.upload_fileobj(
            zip_buffer,
            BUCKET_NAME,
            s3_key
        )
        logger.info(f"Successfully uploaded zip file to S3: {s3_key}")

        # Generate S3 URL
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        logger.info(f"Generated S3 URL: {s3_url}")

        # Initialize Replicate client
        replicate_client = replicate.Client(api_token=os.getenv("REPLICATE_API_TOKEN"))
        
        # Create or get the model first
        full_model_name = create_replicate_model(replicate_client, model_name)
        logger.info(f"Created/Retrieved model: {full_model_name}")
        
        # Create training
        training = replicate_client.trainings.create(
            version="ostris/flux-dev-lora-trainer:e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497",
            input={
                "input_images": s3_url,
                "steps": 2000,
                "lora_rank": 16,
                "optimizer": "adamw8bit",
                "batch_size": 1,
                "resolution": "512,768,1024",
                "autocaption": True,
                "trigger_word": model_name,
                "learning_rate": 0.0004,
                "wandb_project": "flux_train_replicate",
                "wandb_save_interval": 100,
                "caption_dropout_rate": 0.05,
                "cache_latents_to_disk": False,
                "wandb_sample_interval": 100,
                "autocaption_prefix": f"photo of {model_name}"
            },
            destination=full_model_name
        )
        training_id = training.id
        logger.info(f"Started training with ID: {training_id}")

        # Create training run record in database
        training_run = {
            "training_id": training_id,
            "user_id": current_user["_id"],
            "trigger_word": model_name,
            "status": "training",
            "created_at": datetime.utcnow(),
            "replicate_model_id": full_model_name,
            "s3_url": s3_url
        }

        try:
            # Get background client for database operations
            background_db = get_background_db_client()
            db_instance = background_db[settings.DB_NAME]

            # Insert training run record using background client
            await db_instance["training_runs"].insert_one(training_run)

            # Update user's model status using background client
            await db_instance["users"].update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": {
                        "model_status": "training",
                        "current_training_id": training_id
                    },
                    "$push": {
                        "models": {
                            "model_id": str(training_id),
                            "trigger_word": model_name,
                            "status": "training",
                            "created_at": datetime.utcnow(),
                            "replicate_model_id": full_model_name
                        }
                    }
                }
            )

            # Start background polling task with the same background client
            background_tasks.add_task(
                poll_training_status,
                training_id=training_id,
                user_id=str(current_user["_id"]),
                replicate_client=replicate_client,
                db_client=db_instance
            )

        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            db_error = e

        if db_error is not None:
            raise db_error

        return {
            "status": "success",
            "training_id": str(training_id),
            "model_name": model_name
        }

    except Exception as e:
        logger.error(f"Unhandled exception in upload-and-train: {str(e)}")
        if training_id and background_db:
            # Try to update the training status to error if we have a training ID
            try:
                db_instance = background_db[settings.DB_NAME]
                await db_instance["training_runs"].update_one(
                    {"training_id": training_id},
                    {"$set": {
                        "status": "error",
                        "error": str(e),
                        "completed_at": datetime.utcnow()
                    }}
                )
            except Exception as db_error:
                logger.error(f"Failed to update error status: {str(db_error)}")
    finally:
        # Clean up temporary files
        for temp_path in temp_files:
            try:
                os.unlink(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.error(f"Error cleaning up temp file {temp_path}: {str(e)}")

@router.get("/check-training-status/{training_id}")
async def check_training_status(
    training_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        # Find the training run
        training_run = await db["training_runs"].find_one({"training_id": training_id})
        
        if not training_run:
            raise HTTPException(status_code=404, detail="Training run not found")
            
        # Verify the training run belongs to the current user
        if str(training_run["user_id"]) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to access this training run")

        # Initialize Replicate client
        replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
        
        # Get training status from Replicate
        status_response = replicate_client.trainings.get(training_id)
        current_status = status_response.status

        # Update training run with current status
        update_data = {
            "status": current_status
        }
        
        # If training is completed, update with output data
        if current_status == "succeeded":
            update_data.update({
                "version": status_response.output.get("version"),
                "weights": status_response.output.get("weights")
            })
            
            # Update user's model status
            await db["users"].update_one(
                {"_id": training_run["user_id"]},
                {"$set": {
                    "model_status": "completed",
                    "current_training_id": None
                }}
            )
        elif current_status in ["failed", "canceled"]:
            # Update user's model status for failed cases
            await db["users"].update_one(
                {"_id": training_run["user_id"]},
                {"$set": {
                    "model_status": "error",
                    "current_training_id": None
                }}
            )

        await db["training_runs"].update_one(
            {"training_id": training_id},
            {"$set": update_data}
        )

        return {
            "status": current_status,
            "version": status_response.output.get("version") if current_status == "succeeded" else None,
            "weights": status_response.output.get("weights") if current_status == "succeeded" else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/training-runs")
async def get_training_runs(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        user_id = current_user.get('_id')
        cursor = db["training_runs"].find({"user_id": user_id}).sort("created_at", -1)
        training_runs = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for run in training_runs:
            run["_id"] = str(run["_id"])
            run["user_id"] = str(run["user_id"])
        
        return training_runs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/poll-training-runs")
async def poll_training_runs(
    db: AsyncIOMotorClient = Depends(get_db)
):
    try:
        # Find all training runs that are in progress
        cursor = db["training_runs"].find({"status": "training"})
        training_runs = await cursor.to_list(length=None)
        
        # Initialize Replicate client
        replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
        
        updated_runs = []
        for run in training_runs:
            try:
                # Get training status from Replicate
                status_response = replicate_client.trainings.get(run["training_id"])
                current_status = status_response.status
                
                # Update training run with current status
                update_data = {
                    "status": current_status
                }
                
                # If training is completed, update with output data
                if current_status == "succeeded":
                    update_data.update({
                        "version": status_response.output.get("version"),
                        "weights": status_response.output.get("weights")
                    })
                    
                    # Update user's model status
                    await db["users"].update_one(
                        {"_id": run["user_id"]},
                        {"$set": {
                            "model_status": "completed",
                            "current_training_id": None
                        }}
                    )
                elif current_status in ["failed", "canceled"]:
                    # Update user's model status for failed cases
                    await db["users"].update_one(
                        {"_id": run["user_id"]},
                        {"$set": {
                            "model_status": "error",
                            "current_training_id": None
                        }}
                    )

                await db["training_runs"].update_one(
                    {"training_id": run["training_id"]},
                    {"$set": update_data}
                )
                
                updated_runs.append({
                    "training_id": run["training_id"],
                    "status": current_status,
                    "version": status_response.output.get("version") if current_status == "succeeded" else None,
                    "weights": status_response.output.get("weights") if current_status == "succeeded" else None
                })
                
            except Exception as e:
                # Log the error but continue processing other runs
                print(f"Error processing training run {run['training_id']}: {str(e)}")
                continue

        return {
            "status": "success",
            "updated_runs": updated_runs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/init-upload")
async def init_upload(
    file_count: int,
    total_size: int,
    model_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Initialize a new upload session"""
    try:
        upload_id = str(uuid.uuid4())
        # Use a dedicated directory for upload sessions instead of system temp
        base_upload_dir = Path("upload_sessions")
        base_upload_dir.mkdir(exist_ok=True)
        
        upload_dir = base_upload_dir / upload_id
        upload_dir.mkdir(exist_ok=True)
        
        # Store session info in a metadata file
        session_metadata = {
            "upload_id": upload_id,
            "user_id": str(current_user["_id"]),
            "model_name": model_name,
            "file_count": file_count,
            "total_size": total_size,
            "uploaded_chunks": 0,
            "status": "initialized",
            "created_at": datetime.utcnow().isoformat()
        }
        
        with open(upload_dir / "session.json", "w") as f:
            json.dump(session_metadata, f)
        
        return {"upload_id": upload_id}
    except Exception as e:
        logger.error(f"Error initializing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-chunk/{upload_id}")
async def upload_chunk(
    background_tasks: BackgroundTasks,
    upload_id: str,
    chunk_index: int = Query(...),
    total_chunks: int = Query(...),
    file_index: int = Query(...),
    filename: str = Query(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    """Handle individual chunk uploads"""
    try:
        # Use the dedicated upload directory
        base_upload_dir = Path("upload_sessions")
        upload_dir = base_upload_dir / upload_id
        session_file = upload_dir / "session.json"
        
        if not session_file.exists():
            logger.error(f"Upload session not found: {upload_id}")
            raise HTTPException(status_code=404, detail="Upload session not found")
            
        with open(session_file, 'r') as f:
            session = json.load(f)
            
        # Verify user ownership
        if session["user_id"] != str(current_user["_id"]):
            logger.error(f"Unauthorized access to upload session: {upload_id}")
            raise HTTPException(status_code=403, detail="Not authorized to access this upload session")

        # Validate chunk parameters
        if chunk_index < 0 or chunk_index >= total_chunks:
            logger.error(f"Invalid chunk index: {chunk_index} for total chunks: {total_chunks}")
            raise HTTPException(status_code=400, detail="Invalid chunk index")
        if file_index < 0 or file_index >= session["file_count"]:
            logger.error(f"Invalid file index: {file_index} for file count: {session['file_count']}")
            raise HTTPException(status_code=400, detail="Invalid file index")

        # Create directories if they don't exist
        file_dir = upload_dir / str(file_index)
        file_dir.mkdir(parents=True, exist_ok=True)

        # Store filename metadata
        metadata_file = file_dir / "metadata.json"
        if not metadata_file.exists():
            metadata = {
                "original_filename": filename,
                "total_chunks": total_chunks,
                "received_chunks": []
            }
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f)
        
        # Save chunk with proper error handling
        chunk_path = file_dir / f"chunk_{chunk_index}"
        try:
            content = await file.read()
            with open(chunk_path, "wb") as f:
                f.write(content)
        except Exception as e:
            logger.error(f"Error saving chunk {chunk_index} for file {filename}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save chunk: {str(e)}")

        # Update metadata with received chunk
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        if chunk_index not in metadata["received_chunks"]:
            metadata["received_chunks"].append(chunk_index)
            metadata["received_chunks"].sort()
            
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f)

        # Update session status
        session["uploaded_chunks"] += 1
        with open(session_file, 'w') as f:
            json.dump(session, f)

        # Check if all chunks are uploaded
        expected_chunks = session["file_count"] * total_chunks
        if session["uploaded_chunks"] >= expected_chunks:
            logger.info(f"All chunks received for upload session {upload_id}. Starting processing...")
            # Process upload in the background
            process_task = asyncio.create_task(process_completed_upload(
                upload_id,
                session["model_name"],
                current_user,
                db,
                background_tasks
            ))
            return {"status": "completed", "processing": True}
            
        return {
            "status": "chunk_uploaded",
            "chunks_received": session["uploaded_chunks"],
            "total_expected": expected_chunks
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading chunk: {str(e)}")
        # Clean up temporary files in case of error
        try:
            if 'chunk_path' in locals():
                chunk_path.unlink(missing_ok=True)
        except Exception as cleanup_error:
            logger.error(f"Error cleaning up after failed upload: {str(cleanup_error)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-training-status/{model_name}")
async def check_training_status(
    model_name: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_db)
):
    """Check the status of a model's training"""
    try:
        # Get user's model information
        user = await db["users"].find_one({"_id": current_user["_id"]})
        if not user or "models" not in user:
            raise HTTPException(status_code=404, detail="No models found")

        # Find the specific model
        model = next((m for m in user["models"] if m["model_name"] == model_name), None)
        if not model:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        return {
            "status": model.get("status", "unknown"),
            "model_id": model.get("model_id"),
            "version": model.get("version"),
            "weights": model.get("weights"),
            "created_at": model.get("created_at"),
            "completed_at": model.get("completed_at"),
            "last_checked": model.get("last_checked")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking training status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_completed_upload(upload_id: str, model_name: str, current_user: dict, db: AsyncIOMotorClient, background_tasks: BackgroundTasks):
    """Process a completed upload by assembling chunks and starting training"""
    base_upload_dir = Path("upload_sessions")
    upload_dir = base_upload_dir / upload_id
    temp_files = []
    upload_files = []
    
    try:
        # Update session status
        session_file = upload_dir / "session.json"
        with open(session_file, 'r') as f:
            session = json.load(f)
        
        session["status"] = "processing"
        with open(session_file, 'w') as f:
            json.dump(session, f)

        # Assemble chunks for each file
        for file_dir in upload_dir.iterdir():
            if file_dir.is_dir() and file_dir.name.isdigit():  # Only process numbered directories
                # Get metadata for original filename
                metadata_file = file_dir / "metadata.json"
                if not metadata_file.exists():
                    logger.warning(f"No metadata found for directory {file_dir}")
                    continue

                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                original_filename = metadata.get("original_filename")
                if not original_filename:
                    logger.warning(f"No original filename found in metadata for directory {file_dir}")
                    continue

                # Get file extension from original filename
                file_extension = os.path.splitext(original_filename)[1]
                if not file_extension:
                    file_extension = '.jpg'  # Fallback to .jpg if no extension found
                
                # Get chunks
                chunks = sorted(file_dir.glob('chunk_*'), key=lambda x: int(x.name.split('_')[1]))
                if not chunks:
                    logger.warning(f"No chunks found for file {original_filename}")
                    continue

                # Create a temporary file with the correct extension
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                    temp_path = temp_file.name
                    temp_files.append(temp_path)
                    
                    # Assemble chunks directly into the temporary file
                    for chunk in chunks:
                        with open(chunk, 'rb') as chunk_file:
                            shutil.copyfileobj(chunk_file, temp_file)
                    
                    logger.info(f"Assembled chunks into {temp_path} for {original_filename}")

                # Create UploadFile object with the original filename
                upload_file = UploadFile(
                    filename=original_filename,
                    file=open(temp_path, 'rb')
                )
                upload_files.append(upload_file)
                logger.info(f"Created UploadFile for {original_filename}")

        if not upload_files:
            raise HTTPException(status_code=400, detail="No valid files were assembled")

        # Start the training process with assembled files
        return await upload_and_train(
            files=upload_files,
            model_name=model_name,
            current_user=current_user,
            db=db,
            background_tasks=background_tasks
        )

    except Exception as e:
        logger.error(f"Error processing completed upload: {str(e)}")
        # Update session status to failed
        try:
            session["status"] = "failed"
            session["error"] = str(e)
            with open(session_file, 'w') as f:
                json.dump(session, f)
        except Exception as update_error:
            logger.error(f"Error updating session status: {str(update_error)}")
        raise  # Re-raise the exception after logging
    finally:
        # Clean up upload directory after processing is complete
        try:
            if upload_dir.exists():
                shutil.rmtree(upload_dir)
                logger.info(f"Cleaned up upload directory: {upload_dir}")
        except Exception as e:
            logger.error(f"Error cleaning up upload directory {upload_dir}: {str(e)}")
