export interface InferenceParams {
  prompt: string;
  model_id?: string;
  training_id?: string;
  image_size: string;
  num_outputs: number;
  guidance_scale: number;
  prompt_strength: number;
  num_inference_steps: number;
  aspect_ratio: string;
  extra_lora?: string;
  extra_lora_scale: number;
  output_quality: number;
  model?: string;
  go_fast?: boolean;
  prompt_upsampling?: boolean;
}

export interface InferenceResult {
  inference_id: string;
  status: string;
  output_urls?: string[];
  parameters?: {
    prompt: string;
    image_size: string;
    image_index?: number;
    total_images?: number;
  };
  created_at: string;
  isFavorite?: boolean;
  prompt?: string;
} 