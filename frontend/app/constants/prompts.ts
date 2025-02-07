import type { PromptSuggestion } from '../types';

// Prompt suggestions
export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  { text: "a professional photograph of", category: "Style" },
  { text: "in the style of", category: "Style" },
  { text: "high quality, 4k, detailed", category: "Quality" },
  { text: "cinematic lighting", category: "Lighting" },
  { text: "shot on Canon 5D", category: "Camera" },
  { text: "bokeh effect", category: "Effect" },
  { text: "dramatic composition", category: "Composition" },
  { text: "golden hour lighting", category: "Lighting" },
  { text: "ultra realistic", category: "Quality" },
  { text: "award winning photography", category: "Style" }
] as const; 