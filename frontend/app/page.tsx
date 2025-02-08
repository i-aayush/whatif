'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import ExamplesShowcase from './components/ExamplesShowcase';
import Pricing from './pricing/page';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// import 'swiper/swiper-bundle.min.css';
import { useAuth } from './contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from './config/config';
import GoogleButton from './components/GoogleButton';
import { CAROUSEL_IMAGES, PLACEHOLDER_IMAGE } from './constants/images';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ),
});

const testimonials = [
  {
    name: 'Kuldeep Parewa',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 5,
    feedback:
      'WhatIf is a game-changer! I used it to reimagine my travel photos, and the results were incredible. The AI created artistic variations that looked straight out of a professional editors studio!',
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
      "Great product! I used WhatIf to enhance my old photos, and the results were outstanding. It's intuitive and easy to use. A little tweaking is needed sometimes, but it's worth it!",
  },
  {
    name: 'Aakansha Nag',
    purchase: '✔ VERIFIED PURCHASE',
    rating: 3,
    feedback:
      "Early product, but it has potential. I used it to create unique edits for my Instagram, and the results were decent. The AI could use more training to improve its accuracy.",
  },
];

const styles = `
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-300px * ${CAROUSEL_IMAGES.length}));
    }
  }
  
  .animate-scroll {
    animation: scroll 40s linear infinite;
  }

  .animate-scroll:hover {
    animation-play-state: paused;
  }

  .image-container {
    position: relative;
    overflow: hidden;
  }

  .image-container::before,
  .image-container::after {
    content: '';
    position: absolute;
    top: 0;
    width: 200px;
    height: 100%;
    z-index: 2;
  }

  .image-container::before {
    left: 0;
    background: linear-gradient(to right, white, transparent);
  }

  .image-container::after {
    right: 0;
    background: linear-gradient(to left, white, transparent);
  }
`;

const StyleSheet = () => (
  <style jsx global>
    {styles}
  </style>
);

const CanvasButton = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCanvasClick = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        router.push('/canvas');
      } else {
        console.error('Error:', response.statusText);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCanvasClick}
      disabled={isLoading}
      className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        'Go to Canvas'
      )}
    </button>
  );
};

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen">
      <StyleSheet />
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full bg-gray-900">
        {/* 3D Model */}
        <div className="absolute inset-0 z-0 transform scale-100 [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
          <Spline
            scene="https://prod.spline.design/cbIRUSBPIoZNerUS/scene.splinecode" 
            className="w-full h-full"
            onLoad={() => console.log('Scene loaded')}
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
            {/* <div className="flex gap-4 justify-center">
              {!user ? (
                <Link
                  href="/auth"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105"
                >
                  Get Started
                </Link>
              ) : (
                <StudioButton />
              )}
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105"
              >
                View Pricing
              </Link>
            </div> */}
            <div className="mt-6 max-w-sm mx-auto">
              {user ? (
                <CanvasButton />
              ) : (
                <GoogleButton 
                  text="Sign up with Google" 
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-md text-lg font-medium shadow-lg transition-transform hover:scale-105" 
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Image Carousel */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Bring stories alive with AI characters
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Unlock the power of AI to create stunning images and videos starring your own custom-designed virtual humans
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden image-container">
          <div className="flex gap-8 animate-scroll">
            {/* First set of images */}
            {CAROUSEL_IMAGES.map((image, index) => (
              <div 
                key={`first-${index}`} 
                className="flex-none w-[300px] h-[500px] rounded-2xl overflow-hidden shadow-lg transform transition-transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`Example ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                    target.onerror = null;
                  }}
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {CAROUSEL_IMAGES.map((image, index) => (
              <div 
                key={`second-${index}`} 
                className="flex-none w-[300px] h-[500px] rounded-2xl overflow-hidden shadow-lg transform transition-transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`Example ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                    target.onerror = null;
                  }}
                />
              </div>
            ))}
            {/* Third set for extra smoothness */}
            {CAROUSEL_IMAGES.map((image, index) => (
              <div 
                key={`third-${index}`} 
                className="flex-none w-[300px] h-[500px] rounded-2xl overflow-hidden shadow-lg transform transition-transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`Example ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = PLACEHOLDER_IMAGE;
                    target.onerror = null;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Examples Showcase */}
      <ExamplesShowcase />

      {/* Pricing Section */}
      <Pricing showCredits={false} />
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