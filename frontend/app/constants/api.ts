import { API_URL } from '../config/config';

// API Endpoints
export const ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  SIGNUP: `${API_URL}/api/auth/signup`,
  LOGOUT: `${API_URL}/api/auth/logout`,
  USER: `${API_URL}/api/user`,
  INFERENCE: `${API_URL}/api/inference`,
  MODELS: `${API_URL}/api/models`,
  CANVAS: `${API_URL}/api/canvas`,
  SUBSCRIPTION: `${API_URL}/api/subscription`
} as const;

// API Response Status
export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  COMPLETED: 'completed'
} as const; 