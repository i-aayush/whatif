export interface User {
  _id: string;
  email: string;
  full_name: string;
  model_name?: string;
  model_status?: string;
  current_training_id?: string | null;
  latest_model_version?: string | null;
  latest_model_weights?: string | null;
  created_at?: string;
  updated_at?: string;
  credits: number;
} 