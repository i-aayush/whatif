import { API_URL } from '../config/config';

// API Endpoints
export const ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  SIGNUP: `${API_URL}/auth/signup`,
  LOGOUT: `${API_URL}/auth/logout`,
  USER: `${API_URL}/user`,
  INFERENCE: `${API_URL}/inference`,
  MODELS: `${API_URL}/models`,
  CANVAS: `${API_URL}/canvas`,
  SUBSCRIPTION: `${API_URL}/subscription`,
  CANVAS_INFERENCE: {
    CREATE: `${API_URL}/canvasinference/inference`,
    LIST: `${API_URL}/canvasinference/inferences`,
  },
  TRAINING: {
    POLL: `${API_URL}/training/poll-training-runs`,
    STATUS: `${API_URL}/training/training-runs`,
    CHECK_STATUS: (modelName: string) => `${API_URL}/training/check-training-status/${modelName}`,
    CHECK_TRAINING_ID: (trainingId: string) => `${API_URL}/training/check-training-status/${trainingId}`,
    GET_USER_TRAINING_STATUS: `${API_URL}/users/me`,
    SPECIFIC_TRAINING: (trainingId: string) => `${API_URL}/training/training-runs/${trainingId}`
  }
} as const;

// Training Status Types
export const TRAINING_STATUS = {
  INITIALIZED: 'initialized',
  TRAINING: 'training',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled'
} as const;

// API Response Status
export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  COMPLETED: 'completed'
} as const; 