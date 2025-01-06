'use client'

import { useState } from 'react'
import Image from 'next/image'

const requirements = [
  {
    title: "Don'ts",
    description: "Avoid these types of photos for best results:",
    items: [
      { text: "No group shots", icon: "👥" },
      { text: "No blurry or low resolution photos", icon: "🌫️" },
      { text: "No caps or hats", icon: "🧢" },
      { text: "No silly faces", icon: "🤪" },
      { text: "No car or mirror selfies", icon: "🚗" },
      { text: "No nudity", icon: "🚫" },
    ]
  },
  {
    title: "Don't upload old photos",
    description: "Upload recent photos that show your current appearance. If you use older photos or photos where you look very different, AI may generate headshots that don't resemble you.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    title: "Not too far, not too close, looking at the camera",
    description: "AI needs your face to be clearly visible to understand how you look. Make sure your face is well-lit and not too close or too far from the camera.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    title: "Variety in background, clothes, and expression",
    description: "Photos captured on different occasions, with different backgrounds, clothes and expressions, helps the AI develop a comprehensive understanding of your appearance",
    image: "/placeholder.svg?height=200&width=300"
  }
]

export function PhotoRequirementsModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % requirements.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + requirements.length) % requirements.length)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Photo requirements</h2>
          <p className="text-sm text-gray-500 mb-4">
            The AI will learn about you from your photos. It will pick things that repeat across photos, and assume those to be part of your appearance.
          </p>
          <div className="mt-4">
            {requirements[currentSlide].title === "Don'ts" ? (
              <div>
                <h3 className="text-lg font-semibold">{requirements[currentSlide].title}</h3>
                <p className="text-sm text-gray-500 mb-2">{requirements[currentSlide].description}</p>
                <div className="grid grid-cols-2 gap-2">
                {requirements[currentSlide]?.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold">{requirements[currentSlide].title}</h3>
                <p className="text-sm text-gray-500 mb-2">{requirements[currentSlide].description}</p>
                <Image
                  src={requirements[currentSlide].image || '/default-image.png'} // Fallback image
                  alt={requirements[currentSlide].title}
                  width={300}
                  height={200}
                  className="mx-auto rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={prevSlide} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              &#8592;
            </button>
            <span className="text-sm text-gray-500">
              {currentSlide + 1} / {requirements.length}
            </span>
            <button onClick={nextSlide} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              &#8594;
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

