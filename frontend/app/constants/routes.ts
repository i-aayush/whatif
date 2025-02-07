// App routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  CANVAS: '/canvas',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PRICING: '/pricing'
} as const;

// Navigation items
export const NAV_ITEMS = [
  { name: 'Home', path: ROUTES.HOME },
  { name: 'Canvas', path: ROUTES.CANVAS },
  { name: 'Pricing', path: ROUTES.PRICING }
] as const;

// Auth routes that require authentication
export const PROTECTED_ROUTES = [
  ROUTES.CANVAS,
  ROUTES.PROFILE,
  ROUTES.SETTINGS
] as const;

// Auth routes that should redirect if user is already authenticated
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP
] as const; 