'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const beforeImages = [
  '/placeholder.svg?height=400&width=300',
  '/placeholder.svg?height=400&width=300',
  '/placeholder.svg?height=400&width=300',
]

const afterImages = [
  {
    prompt: "Professional portrait in Paris",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-0%20(2)-7rhltGwd9MUOr8TZrhCt7NWWtA7ZDC.png",
  },
  {
    prompt: "DJ at an outdoor festival",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-1%20(1)-wKPB041GtFPoxyo06N9ookHzT1KAZW.png",
  },
  {
    prompt: "Cyberpunk street style",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-0%20(2).jpg-HJRrPUh6z0JjxIRqXSUGv3YVVQjqYI.jpeg",
  },
]

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
  }
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % afterImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="filter blur-sm"
          />
        </div>
        <div className="relative z-10 text-center text-white">
          <h1 className="text-6xl font-bold mb-4 transition-all duration-700 ease-in-out transform"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
            Reimagine Yourself
          </h1>
          <p className="text-xl mb-8 transition-all duration-700 ease-in-out delay-300 transform"
             style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}>
            Transform your photos with AI-powered creativity
          </p>
          <Link href="/get-started" 
                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-indigo-100 transition duration-300">
            Get Started
          </Link>
        </div>
      </section>

      {/* Before and After Showcase */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Before & After</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="w-full md:w-1/3">
              <h3 className="text-2xl font-semibold mb-4 text-center">Original</h3>
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={beforeImages[currentIndex]}
                  alt="Before"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <h3 className="text-2xl font-semibold mb-4 text-center">Reimagined</h3>
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={afterImages[currentIndex].image}
                  alt="After"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <p className="mt-4 text-center text-gray-600 italic">"{afterImages[currentIndex].prompt}"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prompts and Images Showcase */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Endless Possibilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {afterImages.map((image, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="relative h-64">
                  <Image
                    src={image.image}
                    alt={image.prompt}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-gray-600 italic">"{image.prompt}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
                  <p className="text-4xl font-bold text-indigo-600 mb-6">${plan.price}<span className="text-base font-normal text-gray-600">/month</span></p>
                  <ul className="mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center mb-3">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/checkout?plan=${plan.name.toLowerCase()}&cycle=monthly`}
                        className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300">
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              View full pricing details
            </Link>
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Reimagine Yourself?</h2>
          <p className="text-xl mb-8">Join thousands of users who have already transformed their photos with AI</p>
          <Link href="/get-started" 
                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-indigo-100 transition duration-300">
            Start Your Journey
          </Link>
        </div>
      </section>
    </div>
  )
}

