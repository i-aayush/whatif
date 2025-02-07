'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

const ImageGallery: React.FC = () => {
  const imageUrls = [
    'https://whatif-genai.s3.amazonaws.com/prompt_images/IaGGAJx.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/1NYLbWd.jpeg',
      'https://whatif-genai.s3.amazonaws.com/prompt_images/Ciuh0MY.jpeg',
      'https://whatif-genai.s3.amazonaws.com/prompt_images/BAztCQz.jpeg',
      'https://whatif-genai.s3.amazonaws.com/prompt_images/9ezSDut.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/46QHB22.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/Z3I4sLI.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/HDWB8n6.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/LQcjxHz.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/bu8Dx6w.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/5rAAYu1.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/fHBfVFd.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/Jq2uZuW.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/WY6eZ9a.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/AvBoFqg.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/LoaMzgn.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/bQ9eyyD.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/TniiS2t.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/05fHCVs.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/Nae51Vp.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/NV6cHbh.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/zgR2qvi.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/Nz4uaRf.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/tbhju8O.jpeg',
    'https://whatif-genai.s3.amazonaws.com/prompt_images/QjaOd4k.jpeg',
  ];

  const [visibleImages, setVisibleImages] = useState<number[]>([]);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  // Function to load more images
  const loadMoreImages = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newImages = imageUrls.slice(startIndex, endIndex);
    
    if (newImages.length > 0) {
      setDisplayedImages(prev => [...prev, ...newImages]);
      setCurrentPage(prev => prev + 1);
      setHasMore(endIndex < imageUrls.length);
    } else {
      setHasMore(false);
    }
    
    setIsLoading(false);
  }, [currentPage, isLoading, hasMore]);

  // Intersection Observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMoreImages();
    }
  }, [inView, loadMoreImages, hasMore]);

  useEffect(() => {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setVisibleImages(prev => {
              if (prev.includes(index)) return prev;
              return [...prev, index];
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const imageElements = document.querySelectorAll('.lazy-load');
    imageElements.forEach(el => imageObserver.observe(el));

    return () => imageObserver.disconnect();
  }, [displayedImages]);

  // Close modal when pressing escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
          WhatIf prompt gallery
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          Explore the potential of WhatIf with these prompt examples
        </p>
        
        {/* Two-column masonry grid */}
        <div className="columns-1 sm:columns-2 gap-6 space-y-6">
          {displayedImages.map((url, index) => (
            <div
              key={`${url}-${index}`}
              data-index={index}
              className="lazy-load break-inside-avoid mb-6"
            >
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg"
                onClick={() => setSelectedImage(url)}
              >
                {visibleImages.includes(index) ? (
                  <img
                    src={url}
                    alt={`Example ${index + 1}`}
                    className="w-full h-auto transform transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="text-gray-400">Loading...</div>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                    <p className="text-sm">Click to zoom</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div ref={loadMoreRef} className="mt-8 text-center">
          {isLoading && (
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading more...
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Zoom toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
                className="absolute bottom-4 right-4 text-white hover:text-gray-300 z-50 bg-black bg-opacity-50 rounded-full p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isZoomed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  )}
                </svg>
              </button>

              <div 
                className="w-full h-full overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt="Zoomed view"
                  className={`
                    transition-transform duration-300 ease-in-out cursor-zoom-out
                    ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}
                  `}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    margin: 'auto',
                    display: 'block'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;