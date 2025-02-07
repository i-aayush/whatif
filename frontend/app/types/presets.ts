import type { InferenceParams } from './inference';

export interface PresetConfig {
  name: string;
  icon: string;
  description: string;
  params: Partial<InferenceParams>;
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  type: 'base' | 'custom';
  created_at?: string;
} 