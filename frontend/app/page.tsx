'use client';

import dynamic from 'next/dynamic';
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  )
});

import Link from 'next/link';
import ExamplesShowcase from './components/ExamplesShowcase';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// import 'swiper/swiper-bundle.min.css';

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

const testimonials = [
  {
    name: 'Kuldeep Parewa',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 5,
    feedback:
      'WhatIf is a game-changer! I used it to reimagine my travel photos, and the results were incredible. The AI created artistic variations that looked straight out of a professional editor’s studio!',
  },
  {
    name: 'Priya Mehta',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 5,
    feedback:
      'As a social media content creator, WhatIf has been a lifesaver. I can now transform regular selfies into stunning portraits that grab attention on Instagram. Highly recommend it!',
  },
  {
    name: 'Ravi Patel',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 4,
    feedback:
      'The WhatIf platform is amazing for generating unique edits. Although it took me a couple of tries to get the perfect output, the end result was well worth it. Perfect for personal and professional use!',
  },
  {
    name: 'Sneha Iyer',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 5,
    feedback:
      'WhatIf transformed my wedding photos into breathtaking artistic styles! My family and friends were in awe of the creativity. A must-have tool for anyone who loves photography.',
  },
  {
    name: 'Ankit Verma',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 4,
    feedback:
      'Great product! I used WhatIf to enhance my old photos, and the results were outstanding. It’s intuitive and easy to use. A little tweaking is needed sometimes, but it’s worth it!',
  },
  {
    name: 'Aakansha Nag',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 3,
    feedback:
      'Early product, but it has potential. I used it to create unique edits for my Instagram, and the results were decent. The AI could use more training to improve its accuracy.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full bg-gray-900">
        {/* 3D Model */}
        <div className="absolute inset-0 z-0 transform scale-125 overflow-hidden [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
          <Spline
            scene="https://prod.spline.design/cbIRUSBPIoZNerUS/scene.splinecode" 
            className="w-full h-full"
          />
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center max-w-3xl mx-auto px-4 mt-[330px]">
            <h1 className="text-5xl font-semibold text-white mb-100">
              Reimagine Yourself
            </h1>
            <p className="text-lg text-white/80 mb-8 ">
              Upload your photos and let our AI create stunning variations.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/get-started"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                href="#pricing"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Features that make us special
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Experience the power of AI-driven image transformation
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Items */}
            {[
              {
                title: 'AI-Powered Transformations',
                description: 'Transform your photos into unique artistic styles using advanced AI algorithms.',
              },
              {
                title: 'Multiple Variations',
                description: 'Generate multiple unique variations from a single photo.',
              },
              {
                title: 'Easy Sharing',
                description: 'Share your transformed images easily with friends and social media.',
              },
            ].map((feature, index) => (
              <div key={index} className="pt-6">
                <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <div className="inline-flex items-center justify-center rounded-md bg-indigo-500 p-3 shadow-lg">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Examples Showcase */}
      <ExamplesShowcase />

      {/* Pricing Section */}
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

      {/* Testimonial Section */}
      <div className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white text-center sm:text-4xl mb-10">
            See What Our Customers Are Saying About WhatIf
          </h2>
          {/* Swiper Carousel */}
          <Swiper
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            navigation
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="testimonial-swiper"
          >
            {testimonials.map((testimonial, index) => (
              <SwiperSlide key={index}>
                <div className="bg-white rounded-lg shadow-lg p-6 border border-red-500">
                  {/* Star Ratings */}
                  <div className="flex items-center mb-4">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <svg
                        key={starIndex}
                        className={`h-6 w-6 ${
                          starIndex < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  {/* Feedback */}
                  <p className="text-gray-800 mb-4">{`"${testimonial.feedback}"`}</p>
                  {/* Customer Details */}
                  <div className="text-gray-900 font-bold">{testimonial.name}</div>
                  <div className="text-gray-500 text-sm">{testimonial.purchase}</div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}