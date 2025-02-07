'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiChevronLeft, FiChevronRight, FiDownload, FiShare2, FiHeart, FiCopy } from 'react-icons/fi'
import { generateOgImageUrl } from '../utils/og'
import { Metadata } from 'next'
import toast from 'react-hot-toast'

interface ImageViewerProps {
  images: string[]
  currentIndex: number
  prompt?: string
  onClose: () => void
  onNavigate: (index: number) => void
  onLike?: () => void
  isLiked?: boolean
}

export default function ImageViewer({
  images,
  currentIndex,
  prompt,
  onClose,
  onNavigate,
  onLike,
  isLiked,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [metadata, setMetadata] = useState<Metadata | null>(null)

  useEffect(() => {
    // Generate OG metadata for the current image
    if (images[currentIndex]) {
      const ogImageUrl = generateOgImageUrl({
        prompt,
        imageUrl: images[currentIndex],
      })

      setMetadata({
        openGraph: {
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: prompt || 'Generated image',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          images: [ogImageUrl],
        },
      })
    }
  }, [currentIndex, images, prompt])

  const handleShare = async () => {
    try {
      const ogImageUrl = generateOgImageUrl({
        prompt,
        imageUrl: images[currentIndex],
      })

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this AI-generated image!',
          text: prompt || 'Generated with WhatIf AI',
          url: ogImageUrl,
        })
      } else {
        await navigator.clipboard.writeText(ogImageUrl)
        toast.success('Image URL copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share image')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={() => {
        setShowControls(prev => !prev)
        onClose()
      }}
    >
      {/* Close Button */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
            onClick={onClose}
          >
            <FiX className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <AnimatePresence>
        {showControls && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 text-white bg-black/50 backdrop-blur-sm hover:bg-white/10 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(currentIndex - 1)
                }}
              >
                <FiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            )}
            {currentIndex < images.length - 1 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-white bg-black/50 backdrop-blur-sm hover:bg-white/10 rounded-full transition-colors z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(currentIndex + 1)
                }}
              >
                <FiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Image Container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <img
          src={images[currentIndex]}
          alt={prompt || 'Generated image'}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onLoad={() => setIsLoading(false)}
        />

        {/* Image Actions */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-1/4 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = images[currentIndex]
                  link.download = `image-${currentIndex + 1}.png`
                  link.click()
                }}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <FiDownload className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
              {prompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(prompt)
                    toast.success('Prompt copied to clipboard!')
                  }}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Copy prompt"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
              )}
              {onLike && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onLike()
                  }}
                  className={`p-2 text-white hover:bg-white/10 rounded-full transition-colors ${
                    isLiked ? 'text-red-500' : ''
                  }`}
                  aria-label="Like image"
                >
                  <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prompt Display */}
      <AnimatePresence>
        {showControls && prompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 -translate-x-1/2 max-w-2xl text-center w-full px-4"
          >
            <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 line-clamp-5">
              {prompt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 