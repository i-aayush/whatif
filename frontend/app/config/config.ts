const isLocal = process.env.NODE_ENV === 'development';

export const API_URL = isLocal ? 'http://localhost:8000' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';