// Types for pricing data
export interface BasePlanFeatures {
  credits: number;
  modelsPerMonth: number;
  quality: 'low' | 'medium' | 'high';
  support: 'email' | 'priority-email' | 'priority';
  tools: 'basic' | 'advanced';
  additionalFeatures?: string[];
}

export interface BasePlan {
  name: string;
  monthlyPriceUSD: number;
  features: BasePlanFeatures;
}

export interface PricingPlan {
  name: string;
  priceUSD: number;
  monthlyEquivalentUSD: number;
  features: string[];
}

export interface PricingPlans {
  monthly: PricingPlan[];
  yearly: PricingPlan[];
}

// Credit package types and constants
export interface CreditPackage {
  name: string;
  credits: number;
  priceUSD: number;
  discount: number;
}

export const CREDIT_PACKAGES = {
  starter: {
    name: 'Starter Pack',
    credits: 50,
    priceUSD: 5,
    discount: 0
  },
  pro: {
    name: 'Pro Pack',
    credits: 100,
    priceUSD: 9,
    discount: 10
  },
  premium: {
    name: 'Premium Pack',
    credits: 500,
    priceUSD: 45,
    discount: 20
  }
} as const;

export type CreditPackageType = keyof typeof CREDIT_PACKAGES;

// Constants
export const YEARLY_DISCOUNT = 20; // 20% discount for yearly plans
export const MONTHS_IN_YEAR = 12;
export const FREE_MONTHS_YEARLY = 2; // Number of free months for yearly plans

// Base plan definitions
const BASE_PLANS: BasePlan[] = [
  {
    name: 'Starter',
    monthlyPriceUSD: 9,
    features: {
      credits: 50,
      modelsPerMonth: 1,
      quality: 'low',
      support: 'email',
      tools: 'basic',
    }
  },
  {
    name: 'Pro',
    monthlyPriceUSD: 49,
    features: {
      credits: 500,
      modelsPerMonth: 2,
      quality: 'medium',
      support: 'priority-email',
      tools: 'advanced',
      additionalFeatures: ['Custom model training']
    }
  },
  {
    name: 'Premium',
    monthlyPriceUSD: 199,
    features: {
      credits: 3000,
      modelsPerMonth: 10,
      quality: 'high',
      support: 'priority',
      tools: 'advanced',
      additionalFeatures: ['API access', 'Multiple custom models']
    }
  }
];

// Helper functions
const calculateYearlyPrice = (monthlyPrice: number): number => {
  // For yearly, we charge for 10 months instead of 12 (2 months free)
  const effectiveMonths = MONTHS_IN_YEAR - FREE_MONTHS_YEARLY;
  const yearlyPrice = monthlyPrice * effectiveMonths;
  // Apply the yearly discount
  const discountedPrice = yearlyPrice * (1 - YEARLY_DISCOUNT / 100);
  return Math.round(discountedPrice);
};

const calculateMonthlyEquivalent = (yearlyPrice: number): number => {
  // Divide by 12 to get the effective monthly price
  return Math.round((yearlyPrice / MONTHS_IN_YEAR) * 100) / 100;
};

const formatFeatures = (plan: BasePlan, isYearly: boolean = false): string[] => {
  const features = [
    `${plan.features.credits} AI Photos (credits)${isYearly ? ' per month' : ''}`,
    `Create ${plan.features.modelsPerMonth} AI Model${plan.features.modelsPerMonth > 1 ? 's' : ''} per month`,
    'WhatIf AI photorealistic model',
    `${plan.features.quality.charAt(0).toUpperCase() + plan.features.quality.slice(1)} quality photos`,
    plan.features.support === 'email' ? 'Email support' :
      plan.features.support === 'priority-email' ? 'Priority email support' : 'Priority support',
    `${plan.features.tools === 'basic' ? 'Basic' : 'Advanced'} editing tools`,
    ...(plan.features.additionalFeatures || [])
  ];

  if (isYearly) {
    features.push(`${FREE_MONTHS_YEARLY} months free`);
  }

  return features;
};

// Generate final pricing plans
export const PRICING_PLANS: PricingPlans = {
  monthly: BASE_PLANS.map(plan => ({
    name: plan.name,
    priceUSD: plan.monthlyPriceUSD,
    monthlyEquivalentUSD: plan.monthlyPriceUSD, // Same as monthly price for monthly plans
    features: formatFeatures(plan)
  })),
  yearly: BASE_PLANS.map(plan => {
    const yearlyPrice = calculateYearlyPrice(plan.monthlyPriceUSD);
    return {
      name: plan.name,
      priceUSD: yearlyPrice,
      monthlyEquivalentUSD: calculateMonthlyEquivalent(yearlyPrice),
      features: formatFeatures(plan, true)
    };
  })
}; 