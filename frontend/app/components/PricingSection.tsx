'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import RazorpayButton from './RazorpayButton';
import Link from 'next/link';

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 1999,
    yearlyPrice: 9999,
    features: [
      '100 AI-generated images per month',
      'Basic editing tools',
      'Email support',
      'Access to basic models'
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 3999,
    yearlyPrice: 19999,
    features: [
      'Unlimited AI-generated images',
      'Advanced editing tools',
      'Priority email support',
      'Access to all models',
      'Custom model training'
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 8999,
    yearlyPrice: 49999,
    features: [
      'Everything in Pro',
      'Dedicated support',
      'API access',
      'Multiple custom models',
      'Advanced analytics'
    ],
  },
];

export default function PricingSection() {
  const { isAuthenticated } = useAuth();
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');

  const handleSuccess = () => {
    toast.success('Your subscription has been activated.');
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-500">Choose the plan that's right for you</p>
          
          <div className="mt-6 flex justify-center">
            <div className="relative bg-gray-100 p-0.5 rounded-lg inline-flex">
              <button
                onClick={() => setBillingType('monthly')}
                className={`${
                  billingType === 'monthly'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-50'
                } relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingType('yearly')}
                className={`${
                  billingType === 'yearly'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-50'
                } relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200`}
              >
                Yearly (Save 50%)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-lg divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {formatPrice(billingType === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                  </span>
                  <span className="text-base font-medium text-gray-500">/{billingType}</span>
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {isAuthenticated ? (
                    <RazorpayButton
                      plan={plan.id}
                      billingType={billingType}
                      onSuccess={handleSuccess}
                      onError={handleError}
                    />
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 border border-transparent rounded-md shadow-sm hover:from-purple-600 hover:via-pink-600 hover:to-red-600"
                    >
                      Login to Subscribe
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 