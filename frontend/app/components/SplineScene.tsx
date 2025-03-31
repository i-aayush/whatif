'use client';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useInView } from 'react-intersection-observer';

// Preload function for Spline
const preloadSpline = () => {
  // Start loading the Spline component
  const promise = import('@splinetool/react-spline');
  return promise;
};

// Dynamically import Spline with no SSR
const Spline = dynamic(() => preloadSpline(), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function SplineScene() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Setup intersection observer with threshold and rootMargin
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Start loading when within 200px of viewport
    triggerOnce: true // Only trigger once
  });

  // Preload when component is near viewport
  useEffect(() => {
    if (inView && !isLoaded) {
      preloadSpline().then(() => {
        setIsLoaded(true);
      });
    }
  }, [inView, isLoaded]);

  return (
    <div ref={ref} className="w-full h-full">
      <Suspense fallback={<LoadingSpinner />}>
        {(inView || isLoaded) && (
          <Spline
            scene="https://prod.spline.design/cbIRUSBPIoZNerUS/scene.splinecode"
            style={{ 
              width: '100%',
              height: '100%',
              // maxHeight: '90vh',
              // transform: 'scale(1.2)',
            }}
            onLoad={() => setIsLoaded(true)}
          />
        )}
      </Suspense>
    </div>
  );
} 