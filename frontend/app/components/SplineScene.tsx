'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Dynamically import Spline with no SSR
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function SplineScene() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="w-full h-full">
        <Spline
          scene="https://prod.spline.design/cbIRUSBPIoZNerUS/scene.splinecode"
          style={{ 
            width: '100%',
            height: '100%',
            // maxHeight: '90vh',
            // transform: 'scale(1.2)',
          }}
        />
      </div>
    </Suspense>
  );
} 