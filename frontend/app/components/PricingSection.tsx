'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import RazorpayButton from './RazorpayButton';
import Link from 'next/link';
import { PRICING_PLANS, YEARLY_DISCOUNT, type PricingPlan } from '../constants/pricing';

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
    if (!price || isNaN(price)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#B146D7] mb-2">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-gray-600">
            Start creating amazing AI photos today
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => setBillingType('monthly')}
              className={`px-6 py-2 rounded-lg text-base font-medium transition-all ${
                billingType === 'monthly'
                  ? 'bg-[#B146D7] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingType('yearly')}
              className={`px-6 py-2 rounded-lg text-base font-medium transition-all ${
                billingType === 'yearly'
                  ? 'bg-[#B146D7] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_PLANS[billingType].map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <h3 className={`text-2xl font-semibold mb-6 ${
                plan.name === 'Pro' ? 'text-[#B146D7]' :
                plan.name === 'Premium' ? 'text-[#B146D7]' :
                'text-[#B146D7]'
              }`}>
                {plan.name}
              </h3>
              <div className="flex flex-col mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">
                    {formatPrice(billingType === 'yearly' ? plan.monthlyEquivalentUSD : plan.priceUSD)}
                  </span>
                  <span className="text-gray-600 ml-2">/monthly</span>
                </div>
                {billingType === 'yearly' && (
                  <div className="text-sm text-gray-500 mt-2">
                    {formatPrice(plan.priceUSD)} billed yearly
                  </div>
                )}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0"
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
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              {isAuthenticated ? (
                <RazorpayButton
                  plan={plan}
                  billingType={billingType}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              ) : (
                <Link
                  href="/login"
                  className="block w-full py-3 px-6 rounded-lg text-white font-medium text-center transition-all bg-gradient-to-r from-[#B146D7] to-[#FF6B81] hover:from-[#9935C0] hover:to-[#E85A70]"
                >
                  Get started with {plan.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 