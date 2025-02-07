'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiShare2, FiStar, FiHeart, FiCopy } from 'react-icons/fi'
import { API_URL } from '../config/config'
import { generateOgImageUrl } from '../utils/og'
import toast from 'react-hot-toast'
import { useInView } from 'react-intersection-observer'

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

  // Intersection observer for infinite scrolling
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load examples')
      toast.error('Failed to load examples')
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore])

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView) {
      fetchExamples()
    }
  }, [inView, fetchExamples])

  // Initial load
  useEffect(() => {
    fetchExamples()
  }, [])

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
                <img
                  src={`${example.output_urls[0]}?w=300&h=300&fit=cover`}
                  alt={example.prompt}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                  data-src={example.output_urls[0]}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement
                    const fullResImage = new Image()
                    fullResImage.src = img.dataset.src || ''
                    fullResImage.onload = () => {
                      img.src = fullResImage.src
                      img.classList.add('opacity-100')
                    }
                    img.classList.add('opacity-0', 'transition-opacity', 'duration-300')
                  }}
                />
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