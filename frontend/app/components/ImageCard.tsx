'use client';

import Image from 'next/image';

interface ImageCardProps {
  imageUrl: string;
  prompt?: string;
  onSelect?: () => void;
  selected?: boolean;
}

export default function ImageCard({ imageUrl, prompt, onSelect, selected }: ImageCardProps) {
  return (
    <div 
      className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-md transition-all duration-300 ${
        selected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="aspect-w-1 aspect-h-1 w-full relative h-[400px]">
        <Image
          src={imageUrl}
          alt={prompt || 'Generated image'}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {prompt && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-sm truncate">{prompt}</p>
        </div>
      )}
    </div>
  );
} 