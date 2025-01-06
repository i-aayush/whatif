'use client'

import { useState } from 'react'
import Image from "next/image"
import Link from "next/link"

const examples = [
  {
    prompt: "Professional portrait in Paris, holding a sign that says 'I ❤️ Mishu' in front of the Eiffel Tower, natural lighting, candid smile",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-0%20(2)-7rhltGwd9MUOr8TZrhCt7NWWtA7ZDC.png",
    style: "Travel Photography"
  },
  {
    prompt: "DJ performing at an outdoor festival, bright sunlight, crowd in background, professional equipment, energetic pose",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-1%20(1)-wKPB041GtFPoxyo06N9ookHzT1KAZW.png",
    style: "Event Photography"
  },
  {
    prompt: "Professional headshot, business attire, clean background, natural smile, studio lighting",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-1%20(1).jpg-FpFqZRkj9KKhuB3r65kfcEu54DOdRM.jpeg",
    style: "Corporate Portrait"
  },
  {
    prompt: "Cyberpunk street style, neon lights, night scene, urban setting, wearing streetwear and sunglasses",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-0%20(2).jpg-HJRrPUh6z0JjxIRqXSUGv3YVVQjqYI.jpeg",
    style: "Urban Fashion"
  },
  {
    prompt: "Modern office environment, casual business attire, natural window lighting, warm wooden accents",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-0%20(4)-vSyXAieOHUJPR9Fma3PsmiLy6txhBp.webp",
    style: "Professional Casual"
  }
]

export default function ExamplesShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <section className="py-24 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-full mb-2">
            AI Magic in Action
          </span>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">See the Transformation</h2>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Watch how our AI transforms a single photo into multiple stunning variations. From professional headshots to artistic portraits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-lg shadow-lg">
            <div className="relative aspect-square">
              <Image
                src={examples[selectedIndex].image}
                alt="AI generated image example"
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Style</h3>
              <span className="inline-block px-2 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded">
                {examples[selectedIndex].style}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Prompt Used</h3>
              <p className="text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
                {examples[selectedIndex].prompt}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-1 min-w-[120px] px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${selectedIndex === index
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  Style {index + 1}
                </button>
              ))}
            </div>

            <Link 
              href="/get-started"
              className="inline-flex items-center justify-center w-full h-11 px-8 py-2 text-sm font-medium text-white transition-colors rounded-md bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create Your Own Today
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
} 