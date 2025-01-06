'use client';

import Link from 'next/link';

const pricingPlans = [
  {
    name: 'Basic',
    price: 9.99,
    features: ['10 AI-generated images per month', 'Basic editing tools', 'Email support'],
  },
  {
    name: 'Pro',
    price: 19.99,
    features: ['50 AI-generated images per month', 'Advanced editing tools', 'Priority email support'],
  },
  {
    name: 'Enterprise',
    price: 49.99,
    features: ['Unlimited AI-generated images', 'Full suite of editing tools', '24/7 priority support'],
  },
];

export default function PricingSection() {
  return (
    <div id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-500">Choose the plan that's right for you</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white rounded-lg shadow-lg divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
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
                  <Link
                    href="/get-started"
                    className="w-full inline-flex justify-center py-3 px-5 border border-transparent rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Get started with {plan.name}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 