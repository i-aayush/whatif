'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiShare2, FiStar, FiHeart, FiCopy } from 'react-icons/fi'
import { API_URL } from '../config/config'
import { generateOgImageUrl } from '../utils/og'
import toast from 'react-hot-toast'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'

interface FeedExample {
  _id: string
  prompt: string
  output_urls: string[]
  created_at: string
  isFavorite?: boolean
}

interface FeedExamplesProps {
  onSelectImage: (example: FeedExample, index: number, allExamples: FeedExample[]) => void
  galleryView: 'grid' | 'single'
  onLike?: (example: FeedExample) => void
  isLiked?: (imageUrl: string) => boolean
}

export default function FeedExamples({ onSelectImage, galleryView, onLike, isLiked }: FeedExamplesProps) {
  const [examples, setExamples] = useState<FeedExample[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Intersection observer for infinite scrolling and initial load
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const fetchExamples = useCallback(async () => {
    if (isLoading || !hasMore) return

    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_URL}/canvasinference/feed?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch feed examples')

      const data = await response.json()
      
      // Filter out examples without images
      const validExamples = data.examples.filter((example: FeedExample) => 
        example.output_urls && example.output_urls.length > 0 && example.output_urls[0]
      )
      
      setExamples(prev => [...prev, ...validExamples])
      setHasMore(data.has_more)
      setPage(prev => prev + 1)
      setInitialLoadDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load examples')
      toast.error('Failed to load examples')
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  // Load more when scrolling to bottom or on initial view
  useEffect(() => {
    if (inView && (!initialLoadDone || hasMore)) {
      fetchExamples()
    }
  }, [inView, fetchExamples, initialLoadDone, hasMore])

  const handleShare = async (example: FeedExample, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ogImageUrl = generateOgImageUrl({
        prompt: example.prompt,
        imageUrl: example.output_urls[0],
      });

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this AI-generated image!',
          text: example.prompt || 'Generated with WhatIf AI',
          url: ogImageUrl,
        });
      } else {
        await navigator.clipboard.writeText(ogImageUrl);
        toast.success('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share image');
    }
  };

  // Function to handle image loading
  const handleImageLoad = useCallback((imageUrl: string) => {
    setLoadedImages(prev => new Set(prev).add(imageUrl))
  }, [])

  if (error && examples.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => {
              setPage(0)
              setHasMore(true)
              fetchExamples()
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${
      galleryView === 'grid' 
        ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'
        : 'flex flex-col gap-4 max-w-3xl mx-auto'
    }`}>
      {examples.map((example, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={example._id}
          className={`bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer ${
            galleryView === 'single' ? 'max-w-3xl mx-auto w-full' : ''
          }`}
          onClick={() => onSelectImage(example, index, examples)}
        >
          <div className="aspect-square bg-gray-100 rounded-lg mb-4 relative group">
            {example.output_urls[0] && (
              <>
                <div className="relative w-full h-0 pb-[100%]">
                  <div className="absolute inset-0">
                    <Image
                      src={example.output_urls[0]}
                      alt={example.prompt}
                      className={`rounded-lg transition-opacity duration-300 ${
                        loadedImages.has(example.output_urls[0]) ? 'opacity-100' : 'opacity-0'
                      }`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={75}
                      priority={index < 6}
                      style={{
                        objectFit: 'cover',
                      }}
                      onLoad={() => handleImageLoad(example.output_urls[0])}
                    />
                    <div 
                      className={`absolute inset-0 bg-gray-200 rounded-lg transition-opacity duration-300 ${
                        loadedImages.has(example.output_urls[0]) ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Prompt Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <p className="text-white text-sm line-clamp-2">{example.prompt}</p>
                </div>
                {/* Actions Overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        const link = document.createElement('a')
                        link.href = example.output_urls[0]
                        link.download = `image-${example._id}.png`
                        link.click()
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Download image"
                    >
                      <FiDownload className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => handleShare(example, e)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Share image"
                    >
                      <FiShare2 className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(example.prompt)
                        toast.success('Prompt copied to clipboard!')
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Copy prompt"
                    >
                      <FiCopy className="text-gray-700" />
                    </button>
                    {onLike && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          onLike(example)
                        }}
                        className={`p-2 bg-white rounded-full hover:bg-gray-100 transition-colors ${
                          isLiked?.(example.output_urls[0]) ? 'text-red-500' : 'text-gray-700'
                        }`}
                        aria-label="Like image"
                      >
                        <FiHeart className={`${isLiked?.(example.output_urls[0]) ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}

      {/* Loading indicator */}
      <div ref={ref} className="col-span-full py-4">
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  )
} 