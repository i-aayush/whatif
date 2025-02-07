"""Configuration settings for inference operations"""

# S3 Configuration
S3_BUCKET_NAME = 'whatif-genai'
S3_REGION = 'us-east-1'

# Replicate Configuration
REPLICATE_USERNAME = "i-aayush"
FLUX_TRAINER_VERSION = "ostris/flux-dev-lora-trainer:e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497"

# Inference Parameters
DEFAULT_INFERENCE_PARAMS = {
    "num_outputs": 10,
    "guidance_scale": 7.5,
    "prompt_strength": 0.8,
    "num_inference_steps": 50,
    "output_quality": 100
}

# Database Collections
COLLECTION_AUTOMATED_INFERENCES = "automated_inferences"
COLLECTION_TRAINING_RUNS = "training_runs"
COLLECTION_USERS = "users"

# Training Parameters
TRAINING_PARAMS = {
    "steps": 2000,
    "lora_rank": 16,
    "optimizer": "adamw8bit",
    "batch_size": 1,
    "resolution": "512,768,1024",
    "autocaption": True,
    "learning_rate": 0.0004,
    "wandb_project": "flux_train_replicate",
    "wandb_save_interval": 100,
    "caption_dropout_rate": 0.05,
    "cache_latents_to_disk": False,
    "wandb_sample_interval": 100
}

# S3 Client Configuration
S3_CONFIG = {
    "retries": {
        "max_attempts": 3,
        "mode": "adaptive"
    },
    "connect_timeout": 900,
    "read_timeout": 900,
    "max_pool_connections": 50
} 