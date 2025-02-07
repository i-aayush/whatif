import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';
import { type PricingPlan } from '../constants/pricing';

interface RazorpayButtonProps {
  plan: PricingPlan;
  billingType: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({ plan, billingType, onSuccess, onError }: RazorpayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Get subscription details from backend
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_name: plan.name,
          billing_type: billingType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create subscription');
      }

      const data = await response.json();

      // Initialize Razorpay
      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "WhatIf AI",
        description: `${plan.name} Plan - ${billingType}`,
        handler: async function (response: any) {
          try {
            setIsVerifying(true);
            // Verify the payment
            const verifyResponse = await fetch('/api/subscriptions/verify-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                subscriptionId: response.razorpay_subscription_id,
                signature: response.razorpay_signature
              })
            });

            const verificationResult = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verificationResult.error || 'Payment verification failed');
            }

            // Handle success
            onSuccess();
            // Add a small delay before redirect for better UX
            setTimeout(() => {
              router.push('/canvas');
            }, 1500);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            onError(error.message || 'Payment verification failed');
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
        },
        theme: {
          color: "#F37254"
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      onError(error.message || 'Failed to initiate payment');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isLoading || isVerifying}
        className="w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-md shadow-sm hover:from-purple-600 hover:via-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>Initializing Payment...</span>
          </>
        ) : isVerifying ? (
          <>
            <LoadingSpinner />
            <span>Verifying Payment...</span>
          </>
        ) : (
          'Subscribe Now'
        )}
      </button>
      {isVerifying && (
        <div className="mt-2 text-sm text-center text-gray-600">
          Please wait while we verify your payment...
        </div>
      )}
    </div>
  );
} 