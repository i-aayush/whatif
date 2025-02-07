"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { CAROUSEL_IMAGES, BEFORE_IMAGES, AFTER_IMAGES, PLACEHOLDER_IMAGE } from '../constants/images';

const examples = [
  {
    title: "Professional Corporate",
    description: "Transform casual selfies into polished corporate headshots perfect for LinkedIn and business profiles",
    style: "Corporate Portrait",
    beforeImage: BEFORE_IMAGES[0],
    afterImage: AFTER_IMAGES.corporate,
  },
  {
    title: "Urban Fashion",
    description: "Create stunning fashion portraits with vibrant colors and modern urban aesthetics",
    style: "Urban Fashion",
    beforeImage: BEFORE_IMAGES[1],
    afterImage: AFTER_IMAGES.fashion,
  },
  {
    title: "Travel & Lifestyle",
    description: "Generate beautiful travel photos that look like they were shot by a professional photographer",
    style: "Travel Photography",
    beforeImage: BEFORE_IMAGES[2],
    afterImage: AFTER_IMAGES.travel,
  },
];

export default function ExamplesShowcase() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const selectedExample = examples[selectedIndex];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <span className="inline-block px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full">
            AI Photo Magic
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            Upload your selfies and<br />create your own AI photos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Transform casual selfies into incredible, AI-generated portraits—perfect for professional or personal use.
          </p>
        </div>

        {/* Style Selection */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant={selectedIndex === index ? "default" : "outline"}
              onClick={() => {
                setIsLoading(true);
                setSelectedIndex(index);
              }}
              className={`px-6 py-2 text-base ${
                selectedIndex === index 
                  ? 'bg-black text-white hover:bg-gray-900' 
                  : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              {example.title}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {/* Before/After Grid */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            {/* Before image */}
            <div className="relative w-full max-w-md aspect-[4/5]">
              <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" 
                   style={{ display: isLoading ? 'block' : 'none' }} />
              <Image
                src={selectedExample.beforeImage}
                alt="Original photo"
                fill
                className="object-cover rounded-xl"
                onLoadingComplete={() => setIsLoading(false)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = PLACEHOLDER_IMAGE;
                }}
                priority
              />
              <div className="absolute top-4 left-4 bg-gray-500/20 backdrop-blur-sm text-gray-700 px-4 py-1 rounded-full text-sm font-medium">
                Before
              </div>
            </div>

            {/* Arrow */}
            <div className="text-3xl text-gray-400 hidden md:block">→</div>

            {/* After image */}
            <div className="relative w-full max-w-md aspect-[4/5]">
              <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse" 
                   style={{ display: isLoading ? 'block' : 'none' }} />
              <Image
                src={selectedExample.afterImage}
                alt="AI generated photo"
                fill
                className="object-cover rounded-xl"
                onLoadingComplete={() => setIsLoading(false)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = PLACEHOLDER_IMAGE;
                }}
                priority
              />
              <div className="absolute top-4 left-4 bg-gray-500/20 backdrop-blur-sm text-gray-700 px-4 py-1 rounded-full text-sm font-medium">
                After
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{selectedExample.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{selectedExample.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}