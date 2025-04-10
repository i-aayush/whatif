"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Script from 'next/script';
import { API_URL } from '../config/config';
import { toast } from 'react-hot-toast';
import { 
  PRICING_PLANS, 
  YEARLY_DISCOUNT, 
  CREDIT_PACKAGES,
  type PricingPlan,
  type CreditPackageType 
} from '../constants/pricing';

interface PricingContentProps {
  showCredits?: boolean;
}

export const PricingContent: React.FC<PricingContentProps> = ({ showCredits = true }) => {
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshCredits } = useAuth();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleCreditPurchase = async (packageType: CreditPackageType) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const creditPackage = CREDIT_PACKAGES[packageType];
      
      // Create order
      const response = await fetch(`${API_URL}/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          package_type: packageType,
          amount: creditPackage.priceUSD,
          credits: creditPackage.credits
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      const options = {
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,    // Amount in paise
        currency: data.currency, // INR
        name: "WhatIf AI",
        description: `${creditPackage.name} - ${creditPackage.credits} Credits`,
        image: "/logo.png",
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch(`${API_URL}/credits/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verifyData.detail);

            await refreshCredits();
            toast.success('Credits purchased successfully!');
            router.push('/canvas');
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email
        },
        theme: {
          color: '#9333EA',
        },
        modal: {
          confirm_close: true,
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.');
        setIsLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Credit purchase failed:', error);
      toast.error('Failed to initiate purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscription = async (plan: PricingPlan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
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

      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "WhatIf AI",
        description: `${plan.name} Plan - ${billingType === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
        image: "/logo.png",
        handler: async function (response: any) {
          try {
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

            toast.success('Payment successful! Welcome to WhatIf Pro.');
            router.push('/canvas');
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.full_name,
          email: user.email
        },
        theme: {
          color: '#9333EA',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Subscription creation failed:', error);
      toast.error('Failed to create subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="min-h-screen bg-white">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 sm:text-4xl mb-2">
                Choose Your Perfect Plan
              </h2>
              <p className="text-xl text-gray-500">Start creating amazing AI photos today</p>
            </div>

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
                Yearly (Save {YEARLY_DISCOUNT}%)
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
              {PRICING_PLANS[billingType].map((plan) => (
                <div
                  key={plan.name}
                  className="bg-white rounded-xl shadow-xl divide-y divide-gray-200 transform transition-all hover:scale-105"
                >
                  <div className="p-8">
                    <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {plan.name}
                    </h3>
                    <p className="mt-4">
                      <span className="text-4xl font-extrabold text-gray-900">{formatPrice(plan.priceUSD)}</span>
                      <span className="text-base font-medium text-gray-500">/{billingType}</span>
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

        {/* Credit Packages Section - Only show if showCredits is true */}
        {showCredits && (
          <section id="credits" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 sm:text-4xl mb-2">
                  Need More Credits?
                </h2>
                <p className="text-xl text-gray-500">Purchase additional credits to create more AI photos</p>
              </div>

              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
                {Object.entries(CREDIT_PACKAGES).map(([key, pack]) => (
                  <div key={key} className="bg-white rounded-xl shadow-xl divide-y divide-gray-200 transform transition-all hover:scale-105 relative">
                    {pack.discount > 0 && (
                      <div className="absolute -top-5 left-0 right-0 flex justify-center">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          {pack.discount}% OFF
                        </span>
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {pack.name}
                      </h3>
                      <p className="mt-4">
                        <span className="text-4xl font-extrabold text-gray-900">{formatPrice(pack.priceUSD)}</span>
                      </p>
                      <p className="mt-2 text-sm text-gray-500">{pack.credits} credits</p>
                      <ul className="mt-8 space-y-4">
                        <li className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-base text-gray-700">Generate {pack.credits} AI photos</p>
                        </li>
                        {pack.discount > 0 && (
                          <li className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="ml-3 text-base text-gray-700">Save {pack.discount}% on credits</p>
                          </li>
                        )}
                        <li className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-base text-gray-700">No expiration</p>
                        </li>
                      </ul>
                      <button
                        onClick={() => handleCreditPurchase(key as CreditPackageType)}
                        disabled={isLoading}
                        className="mt-8 w-full inline-flex justify-center py-3 px-5 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Purchase Credits'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}; 