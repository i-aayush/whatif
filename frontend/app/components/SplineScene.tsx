'use client';

import Spline from '@splinetool/react-spline';

export default function SplineScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-full h-full relative">
        <Spline
          scene="https://prod.spline.design/cbIRUSBPIoZNerUS/scene.splinecode"
          style={{ 
            width: '100%',
            height: '100%',
            maxHeight: '90vh',
            transform: 'scale(1.2)',
          }}
        />
      </div>
    </div>
  );
} 