'use client'

import { useState } from 'react'
import Link from 'next/link'

const pricingPlans = [
  {
    name: 'Basic',
    price: 9.99,
    features: ['10 AI-generated images per month', 'Basic editing tools', 'Email support'],
    recommended: false
  },
  {
    name: 'Pro',
    price: 19.99,
    features: ['50 AI-generated images per month', 'Advanced editing tools', 'Priority email support', 'Access to exclusive styles'],
    recommended: true
  },
  {
    name: 'Enterprise',
    price: 49.99,
    features: ['Unlimited AI-generated images', 'Full suite of editing tools', '24/7 priority support', 'Custom AI model training'],
    recommended: false
  }
]

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Pricing Plans
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="mt-12 sm:mt-16 sm:flex sm:justify-center">
          <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="absolute inset-0">
              <div className="h-1/2 bg-gray-50"></div>
            </div>
            <div className="relative max-w-7xl mx-auto">
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 text-sm font-medium ${
                    billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'
                  } rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 text-sm font-medium ${
                    billingCycle === 'yearly' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'
                  } rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {pricingPlans.map((plan) => (
                  <div key={plan.name} className={`bg-white rounded-lg shadow-md overflow-hidden ${plan.recommended ? 'ring-2 ring-indigo-600' : ''}`}>
                    {plan.recommended && (
                      <div className="bg-indigo-600 text-white text-center py-2 text-sm font-semibold">
                        Recommended
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="mt-4">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${billingCycle === 'yearly' ? (plan.price * 0.8 * 12).toFixed(2) : plan.price}
                        </span>
                        <span className="text-base font-medium text-gray-500">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </p>
                      <ul className="mt-6 space-y-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="ml-3 text-base text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8">
                        <Link href={`/checkout?plan=${plan.name.toLowerCase()}&cycle=${billingCycle}`}
                              className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                          Get started
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

