'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

// Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_your_publishable_key')

export default function Checkout() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const cycle = searchParams.get('cycle')

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      console.log('Order placed! You will receive an email confirmation.')
    }

    if (query.get('canceled')) {
      console.log('Order canceled -- continue to shop around and checkout when you are ready.')
    }
  }, [])

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          cycle,
        }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      const { error } = await stripe!.redirectToCheckout({
        sessionId,
      })

      if (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h2>
          <p className="text-gray-600 mb-6">
            You are about to purchase the <span className="font-semibold">{plan}</span> plan with{' '}
            <span className="font-semibold">{cycle}</span> billing.
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

