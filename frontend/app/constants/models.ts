import type { ModelPreset, PresetConfig } from '../types';

// Model presets
export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "black-forest-labs/flux-1.1-pro",
    name: "WhatIf AI",
    description: "High-quality photo-realistic image generation",
    icon: "camera",
    version: "1.0",
    type: 'base'
  }
] as const;

// Parameter presets
export const PARAMETER_PRESETS: PresetConfig[] = [
  {
    name: "High Quality",
    icon: "camera",
    description: "",
    params: {
      num_inference_steps: 50,
      output_quality: 100,
      model: "dev"
    }
  },
  {
    name: "Fast",
    icon: "zap",
    description: "",
    params: {
      num_inference_steps: 28,
      output_quality: 80,
      model: "schnell"
    }
  }
] as const; 