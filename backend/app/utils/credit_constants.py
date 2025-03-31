"""Constants for credit system"""

# Credit costs for different operations
INFERENCE_COSTS = {
    "base_inference": 1,  # Base cost per inference
    "additional_output": 1,  # Cost per additional output
    "high_quality": 2,  # Additional cost for high quality
    "extra_steps": 1,  # Cost per 10 additional steps over base
}

TRAINING_COSTS = {
    "base_training": 50,  # Base cost for model training
    "per_image": 2,  # Additional cost per training image
    "high_quality": 20,  # Additional cost for high quality training
}



# Credit packages with USD pricing
CREDIT_PACKAGES = {
    "starter": {
        "name": "Starter Pack",
        "credits": 50,
        "price_usd": 5,
        "discount": 0
    },
    "pro": {
        "name": "Pro Pack",
        "credits": 100,
        "price_usd": 9,
        "discount": 10
    },
    "premium": {
        "name": "Premium Pack",
        "credits": 500,
        "price_usd": 45,
        "discount": 20
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

def calculate_training_cost(num_images: int, high_quality: bool = False) -> int:
    """Calculate the total credit cost for a training request"""
    total_cost = TRAINING_COSTS["base_training"]
    
    # Add cost for each training image
    total_cost += num_images * TRAINING_COSTS["per_image"]
    
    # Add cost for high quality training if requested
    if high_quality:
        total_cost += TRAINING_COSTS["high_quality"]
    
    return total_cost 