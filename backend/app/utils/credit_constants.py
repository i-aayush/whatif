"""Constants for credit system"""

# Credit costs for different operations
INFERENCE_COSTS = {
    "base_inference": 1,  # Base cost per inference (1 credit per image)
    "additional_output": 0,  # Cost per additional output
    "high_quality": 0,  # Additional cost for high quality
    "extra_steps": 0,  # Cost per 10 additional steps over base
}

TRAINING_COSTS = {
    "base_training": 100,  # Base cost for model training
    "per_image": 0,  # Additional cost per training image
    "high_quality": 0,  # Additional cost for high quality training
}

# Credit packages with USD and INR pricing
CREDIT_PACKAGES = {
    "starter": {
        "name": "Starter",
        "credits": 50,
        "models_per_month": 1,
        "price_usd": 9,
        "price_inr": 774,
        "currency": "USD",
        "description": "Perfect for getting started",
        "features": [
            "50 AI Photos (credits)",
            "Create 1 AI Model per month",
            "WhatIf AI photorealistic model",
            "Low quality photos"
        ]
    },
    "pro": {
        "name": "Pro",
        "credits": 500,
        "models_per_month": 2,
        "price_usd": 49,
        "price_inr": 4214,
        "currency": "USD",
        "description": "Most popular for regular users",
        "features": [
            "500 AI Photos (credits)",
            "Create 2 AI Models per month",
            "WhatIf AI photorealistic model",
            "Medium quality photos"
        ]
    },
    "premium": {
        "name": "Premium",
        "credits": 3000,
        "models_per_month": 10,
        "price_usd": 199,
        "price_inr": 17114,
        "currency": "USD",
        "description": "Best value for power users",
        "features": [
            "3,000 AI Photos (credits)",
            "Create 10 AI Models per month",
            "WhatIf AI photorealistic model",
            "High quality photos"
        ]
    }
}

# Cost calculation functions
def calculate_inference_cost(params: dict) -> int:
    """Calculate the total credit cost for an inference request"""
    total_cost = INFERENCE_COSTS["base_inference"]
    
    # Additional outputs cost
    if params.get("num_outputs", 1) > 1:
        additional_outputs = params["num_outputs"] - 1
        total_cost += additional_outputs * INFERENCE_COSTS["additional_output"]
    
    # High quality cost
    if params.get("output_quality", 80) > 90:
        total_cost += INFERENCE_COSTS["high_quality"]
    
    # Extra steps cost
    base_steps = 41  # Base number of steps
    if params.get("num_inference_steps", base_steps) > base_steps:
        extra_steps = params["num_inference_steps"] - base_steps
        total_cost += (extra_steps // 10) * INFERENCE_COSTS["extra_steps"]
    
    return total_cost

def calculate_training_cost(params: dict) -> int:
    """Calculate the total credit cost for a training request"""
    total_cost = TRAINING_COSTS["base_training"]
    
    # Cost per training image
    num_images = len(params.get("files", []))
    total_cost += num_images * TRAINING_COSTS["per_image"]
    
    # High quality training cost
    if params.get("high_quality", False):
        total_cost += TRAINING_COSTS["high_quality"]
    
    return total_cost 