import type { InferenceParams } from '../types';

// Default inference parameters
export const DEFAULT_PARAMS: InferenceParams = {
  prompt: '',
  image_size: '1024x1024',
  num_outputs: 1,
  guidance_scale: 3.0,
  prompt_strength: 0.96,
  num_inference_steps: 41,
  aspect_ratio: '1:1',
  extra_lora_scale: 1,
  output_quality: 80,
  model: "black-forest-labs/flux-1.1-pro",
  prompt_upsampling: true
};

// Parameter descriptions for tooltips
export const PARAMETER_DESCRIPTIONS = {
  model_name: "The model to use for inference",
  aspect_ratio: "Width to height ratio of the output image",
  image_count: "Number of images to generate in one run",
  prompt: "Text description of the image you want to generate",
  image_size: "Size of the output image in pixels",
  num_outputs: "Number of images to generate in one run",
  guidance_scale: "How closely to follow the prompt (higher = more faithful but less creative)",
  prompt_strength: "Strength of the prompt in guiding image generation (0-1)",
  num_inference_steps: "Number of denoising steps (higher = better quality but slower)",
  extra_lora: "Load LoRA weights. Supports Replicate models (<owner>/<username>), HuggingFace URLs (huggingface.co/<owner>/<model-name>), CivitAI URLs (civitai.com/models/<id>), or .safetensors URLs",
  extra_lora_scale: "Scale factor for the extra LoRA weights (0-1)",
  output_quality: "Quality of the output image (0-100)"
} as const; 