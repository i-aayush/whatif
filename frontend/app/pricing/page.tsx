"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Script from 'next/script';
import Link from 'next/link';
import { API_URL } from '../config/config';

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  annualPrice?: number;
}

const pricingPlans = {
  monthly: [
    {
      name: 'Starter',
      price: 1999,
      features: [
        'Take 50 AI Photos (credits)',
        'Create 1 AI Model per month',
        'Flux™ 1.1 photorealistic model',
        'Low quality photos',
      ],
    },
    {
      name: 'Pro',
      price: 3999,
      features: [
        'Take 1,000 AI Photos (credits)',
        'Create 3 AI Models per month',
        'Flux™ 1.1 photorealistic model',
        'Medium quality photos',
      ],
    },
    {
      name: 'Premium',
      price: 8999,
      features: [
        'Take 3,000 AI Photos (credits)',
        'Create 10 AI Models per month',
        'Flux™ 1.1 photorealistic model',
        'High quality photos',
      ],
    },
  ],
  yearly: [
    {
      name: 'Starter',
      price: 9999,
      annualPrice: 9999,
      features: [
        'Take 50 AI Photos (credits)',
        'Create 1 AI Model per month',
        'Flux™ 1.1 photorealistic model',
        'Low quality photos',
      ],
    },
    {
      name: 'Pro',
      price: 19999,
      annualPrice: 19999,
      features: [
        'Take 1,000 AI Photos (credits)',
        'Create 3 AI Models per month',
        'Flux™ 1.1 photorealistic model',
        'Medium quality photos',
      ],
    },
    {
      name: 'Premium',
      price: 49999,
      annualPrice: 49999,
      features: [
        'Take 3,000 AI Photos (credits)',
        'Create 10 AI Models per month',
        'Flux™ 1.1 photorealistic model',
        'High quality photos',
      ],
    },
  ],
};

export default function Pricing() {
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSubscription = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      // Create subscription using backend API directly
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/subscriptions/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_name: plan.name.toLowerCase(),
          billing_type: billingType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      // Initialize Razorpay
      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "WhatIf AI",
        description: `${plan.name} Plan - ${billingType === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
        image: "/logo.png",
        handler: async function (response: any) {
          try {
            // Verify payment using backend API directly
            const verifyResponse = await fetch(`${API_URL}/subscriptions/verify-subscription`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                subscription_id: response.razorpay_subscription_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verifyData.detail);

            // Redirect to get-started page after successful payment
            router.push('/get-started');
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email,
          contact: user.phone_number,
        },
        theme: {
          color: '#9333EA',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Subscription creation failed:', error);
      alert('Failed to create subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-white">
        {/* Pricing Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-500">Choose the plan that's right for you</p>
            </div>

            {/* Billing Type Tabs */}
            <div className="mt-8 flex justify-center space-x-4">
              <button
                className={`py-2 px-4 font-semibold rounded-lg transition-all ${billingType === 'monthly' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setBillingType('monthly')}
              >
                Monthly
              </button>
              <button
                className={`py-2 px-4 font-semibold rounded-lg transition-all ${billingType === 'yearly' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setBillingType('yearly')}
              >
                Yearly
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
              {pricingPlans[billingType].map((plan) => (
                <div
                  key={plan.name}
                  className="bg-white rounded-xl shadow-xl divide-y divide-gray-200 transform transition-all hover:scale-105"
                >
                  <div className="p-8">
                    <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                      {plan.name}
                    </h3>
                    <p className="mt-4">
                      <span className="text-4xl font-extrabold text-gray-900">{formatPrice(plan.price)}</span>
                      {billingType === 'monthly' && (
                        <span className="text-base font-medium text-gray-500">/month</span>
                      )}
                      {billingType === 'yearly' && (
                        <div className="text-sm text-gray-500 mt-1">
                          Billed annually
                        </div>
                      )}
                    </p>
                    <ul className="mt-8 space-y-4">
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
                      <button
                        onClick={() => handleSubscription(plan)}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center py-3 px-5 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : `Get started with ${plan.name}`}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="ai-photos-section py-24 bg-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center lg:items-start">
    {/* Text Section */}
    <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Start taking AI photos now</h2>
      <p className="text-lg text-gray-700 mb-8">
        Generate photorealistic images and videos of people with AI. Take stunning photos with the first AI Photographer! 
        Save time and money by doing an AI photo shoot from your laptop or phone instead of hiring an expensive photographer. 
        Create personalized AI clones and take incredible photos in any pose or outfit.
      </p>
      <ul className="space-y-4 mb-8">
        <li className="flex items-start">
          <span className="text-purple-600 text-2xl font-bold mr-3">✏️</span>
          <p>
            <a href="#" className="text-purple-600 font-medium hover:underline">Upload selfies</a> and create your own Flux™ AI clone.
          </p>
        </li>
        <li className="flex items-start">
          <span className="text-purple-600 text-2xl font-bold mr-3">📸</span>
          <p>
            <a href="#" className="text-purple-600 font-medium hover:underline">Take 100% AI photos</a> in any pose, place, or action.
          </p>
        </li>
        <li className="flex items-start">
          <span className="text-purple-600 text-2xl font-bold mr-3">🛍️</span>
          <p>
            <a href="#" className="text-purple-600 font-medium hover:underline">Try on clothes</a> on your model for your Shopify store.
          </p>
        </li>
        <li className="flex items-start">
          <span className="text-purple-600 text-2xl font-bold mr-3">❤️</span>
          <p>
            <a href="#" className="text-purple-600 font-medium hover:underline">Swap outfits</a> like AI Dating or Instagram.
          </p>
        </li>
      </ul>
      <Link href="/" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700">
        Create your AI clone
      </Link>
    </div>

    {/* Photo Section */}
    <div className="lg:w-1/2 mt-8 lg:mt-0">
      <img 
        src="https://replicate.delivery/czjl/JYwgLMRqADbKAlspeeoiti0W56VVcGAhPwnXQ2ZkfcefscYgC/tmpf06qs680.jpg" 
        alt="AI Photos" 
        className="rounded-lg shadow-lg w-full"
      />
    </div>
  </div>
</section>
      </div>
    </>
  );
}