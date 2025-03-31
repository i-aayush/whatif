import React, { useState, useCallback } from 'react';
import { uploadInChunks } from '../utils/chunkUpload';
import { FileUploader } from './FileUploader';
import { API_URL } from '../config/config';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 20;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const INSTRUCTION_TILES = [
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/group.png",
    title: "No group photos",
    description: "Please upload only individual photos of yourself."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/blurry.png",
    title: "No blurry or low-resolution photos",
    description: "Ensure your face is clear and in focus."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/hats.png",
    title: "No caps or hats",
    description: "Avoid covering your head unless for medical or religious reasons."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/poses.png",
    title: "No silly faces",
    description: "Use natural expressions without exaggerated poses."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/car_selfie.png",
    title: "No car selfies",
    description: "Avoid taking photos in vehicles or in mirrors."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/nude.png",
    title: "No nudity",
    description: "Ensure appropriate clothing in all images."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/clothes.png",
    title: "Upload recent photos",
    description: "Use photos that reflect your current appearance."
  },
  {
    image: "https://whatif-genai.s3.amazonaws.com/prompt_images/clothes1.png",
    title: "Variety in backgrounds and clothing",
    description: "Upload photos with different settings and outfits."
  }
];

interface ImageUploadInstructionsProps {
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  modelName?: string;
  onUploadStart?: () => void;
  onUploadComplete?: (uploadId: string) => void;
  onUploadError?: (error: Error) => void;
}

const ImageUploadInstructions: React.FC<ImageUploadInstructionsProps> = ({
  uploadedFiles,
  setUploadedFiles,
  modelName = '',
  onUploadStart,
  onUploadComplete,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const validateFiles = (files: File[]): string | null => {
    console.log('Validating files...');
    
    if (files.length > MAX_FILES) {
      return `Maximum ${MAX_FILES} files allowed`;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return `Total size cannot exceed ${MAX_TOTAL_SIZE / (1024 * 1024)}MB`;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      }
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `File "${file.name}" is not a supported image type. Please use JPG or PNG files only.`;
      }
    }

    return null;
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    setError(null);
    
    if (!files || files.length === 0) {
      console.log('No files selected for upload');
      return;
    }
    
    const fileArray = Array.from(files);
    console.log(`Validating ${fileArray.length} files...`);
    
    const validationError = validateFiles(fileArray);
    if (validationError) {
      console.error('Validation error:', validationError);
      onUploadError?.(new Error(validationError));
      setError(validationError);
      return;
    }

    setUploadedFiles(fileArray);
  }, [setUploadedFiles, onUploadError]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Photo Upload Requirements</h1>
      <p className="text-center text-gray-600 mb-6">To ensure the best results, follow these photo requirements when uploading your images.</p>
      
      <div className="relative px-8">
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex -ml-4">
            {INSTRUCTION_TILES.map((tile, index) => (
              <div 
                key={index} 
                className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <div className="p-4 border rounded-lg bg-white shadow-sm h-full hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={tile.image} 
                    alt={tile.title} 
                    className="w-40 h-40 object-cover rounded-lg mb-2 mx-auto" 
                  />
                  <p className="text-center">
                    <span className="text-red-500 font-bold">{tile.title}:</span>{' '}
                    {tile.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-all z-10"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition-all z-10"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="flex justify-center gap-2 mt-4">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex ? 'bg-blue-500 w-4' : 'bg-gray-300'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-sm text-gray-600">
          <p>• Maximum {MAX_FILES} files allowed</p>
          <p>• Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB per file</p>
          <p>• Total maximum size: {MAX_TOTAL_SIZE / (1024 * 1024)}MB</p>
          <p>• Supported formats: JPG, PNG</p>
          <p>• Currently uploaded: {uploadedFiles.length} files</p>
        </div>

        <FileUploader
          onFileSelect={handleFileUpload}
          isUploading={isUploading}
          accept="image/jpeg,image/png"
          multiple
          className="w-full border-2 border-dashed border-gray-300 p-4 rounded-lg hover:border-gray-400 transition-colors"
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Uploading... {uploadProgress.toFixed(0)}%
          </p>
        </div>
      )}

      <p className="text-center text-green-600 mt-6">
        {isUploading ? 'Uploading...' : 'Once you\'re ready, proceed with the upload to start fine-tuning your model!'}
      </p>
    </div>
  );
};

export default ImageUploadInstructions;