export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    annualPrice: 90,
    features: [
      '50 AI Photos (credits)',
      'Create 1 AI Model per month',
      'WhatIf AI photorealistic model',
      'Basic editing tools',
      'Email support'
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    annualPrice: 490,
    features: [
      '500 AI Photos (credits)',
      'Create 2 AI Models per month',
      'WhatIf AI photorealistic model',
      'Advanced editing tools',
      'Priority email support'
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    annualPrice: 1990,
    features: [
      '3,000 AI Photos (credits)',
      'Create 10 AI Models per month',
      'WhatIf AI photorealistic model',
      'Advanced editing tools',
      'Priority support',
      'API access'
    ],
  },
]; 