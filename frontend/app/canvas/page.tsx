'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { FiSliders, FiImage, FiGrid, FiMaximize, FiInfo, FiChevronDown, FiChevronUp, FiZap, FiCamera, FiUser, FiX, FiSettings, FiChevronRight, FiDownload, FiShare2, FiHelpCircle, FiClock, FiStar, FiPlus, FiCompass, FiArrowUp, FiHeart } from 'react-icons/fi'
import { Tooltip } from '../components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import ImageViewer from '../components/ImageViewer'
import { useDropzone } from 'react-dropzone'
import ImageUploadInstructions from '../components/ImageUploadInstructions'
import Pricing from '../pricing/page'
import FeedExamples from '../components/FeedExamples'
import { uploadInChunks } from '../utils/chunkUpload'
import { useInView } from 'react-intersection-observer'
import { 
  API_URL, 
  IMAGE_SIZES, 
  ASPECT_RATIOS, 
  MODEL_PRESETS, 
  PARAMETER_PRESETS,
  PROMPT_SUGGESTIONS,
  SIDEBAR,
  TOAST_MESSAGES,
  DEFAULT_PARAMS,
  PARAMETER_DESCRIPTIONS
} from '../constants'
import type {
  InferenceParams,
  InferenceResult,
  PresetConfig,
  PromptSuggestion,
  ModelPreset
} from '../types'
import { ENDPOINTS } from '../constants/api';

interface SelectedOption {
  type: 'model' | 'preset' | 'aspect';
  value: string;
  label: string;
  icon?: string;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startWidth: number;
}

interface ModelCreationState {
  modelName: string;
  uploadedFiles: File[];
  isUploading: boolean;
  isTraining: boolean;
  error: string;
  uploadProgress: number;
}

interface FavoriteImage {
  id: string;
  imageUrl: string;
  prompt?: string;
  timestamp: string;
}

// Add debounce utility with proper typing
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface RecentPrompt {
  text: string;
  timestamp: string;
}

// Add this near other interfaces
interface FavoriteImage {
  id: string;
  imageUrl: string;
  prompt?: string;
  timestamp: string;
}

// Add this helper function near the top of the file
const highlightModelName = (text: string, modelName: string) => {
  if (!modelName || !text) return text;
  const regex = new RegExp(`(${modelName})`, 'gi');
  return text.split(regex).map((part, i) => 
    regex.test(part) ? 
      `<span class="text-blue-600 font-medium">${part}</span>` : 
      part
  ).join('');
};

export default function CanvasPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, checkModelStatus } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<{status: string} | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [inferenceResults, setInferenceResults] = useState<InferenceResult[]>([])
  const [inferenceParams, setInferenceParams] = useState<InferenceParams>(DEFAULT_PARAMS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelPreset | null>(null)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [customModels, setCustomModels] = useState<ModelPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showRecentPrompts, setShowRecentPrompts] = useState(false)
  const [showPromptGuide, setShowPromptGuide] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(384)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startWidth: 384
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<PromptSuggestion[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debouncedInputValue = useDebounce(inputValue, 300)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [selectedResult, setSelectedResult] = useState<InferenceResult | null>(null)
  const [availableModels, setAvailableModels] = useState<ModelPreset[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // Add new state variables for model creation
  const [showModelCreation, setShowModelCreation] = useState(false)
  const [modelCreation, setModelCreation] = useState<ModelCreationState>({
    modelName: '',
    uploadedFiles: [],
    isUploading: false,
    isTraining: false,
    error: '',
    uploadProgress: 0
  })

  const [showPricingModal, setShowPricingModal] = useState(false);

  // Add new state for active inference
  const [activeInference, setActiveInference] = useState<string | null>(null);
  const [inferenceProgress, setInferenceProgress] = useState<{[key: string]: number}>({});
  const [estimatedTime, setEstimatedTime] = useState<{[key: string]: number}>({});

  const [selectedTab, setSelectedTab] = useState<'recent' | 'favorites' | 'feed'>('recent')
  const [feedExamples, setFeedExamples] = useState<any[]>([])

  const [favorites, setFavorites] = useState<FavoriteImage[]>([])

  // Add this near other state declarations
  const [initialLoad, setInitialLoad] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Handle liking/unliking images
  const handleLikeImage = (result: InferenceResult) => {
    const imageUrl = result.output_urls?.[0];
    if (!imageUrl) return;

    setFavorites(prev => {
      const isLiked = prev.some(fav => fav.imageUrl === imageUrl);
      let newFavorites;

      if (isLiked) {
        // Remove from favorites
        newFavorites = prev.filter(fav => fav.imageUrl !== imageUrl);
      } else {
        // Add to favorites
        newFavorites = [...prev, {
          id: result.inference_id,
          imageUrl,
          prompt: result.parameters?.prompt,
          timestamp: new Date().toISOString()
        }];
      }

      // Save to localStorage
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });

    // Update the inference result to show liked state
    setInferenceResults(prev => 
      prev.map(r => 
        r.inference_id === result.inference_id 
          ? { ...r, isFavorite: !r.isFavorite }
          : r
      )
    );
  };

  // Check if an image is liked
  const isImageLiked = (imageUrl: string) => {
    return favorites.some(fav => fav.imageUrl === imageUrl);
  };

  // Add shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Modify tab selection to include shuffling
  const handleTabChange = (tab: 'recent' | 'favorites' | 'feed') => {
    setSelectedTab(tab);
    if (tab === 'feed') {
      setFeedExamples(prev => shuffleArray(prev));
    }
  };

  // Add useEffect to set default model and preset
  useEffect(() => {
    if (availableModels.length > 0) {
      // Try to find a custom model first
      const customModel = availableModels.find(m => m.type === 'custom');
      if (customModel) {
        setSelectedModel(customModel);
        setInferenceParams(prev => ({
          ...prev,
          model_id: customModel.id
        }));
        toggleOption({
          type: 'model',
          value: customModel.id,
          label: customModel.name,
          icon: customModel.icon
        });
      }

      // Apply Fast preset by default
      const fastPreset = PARAMETER_PRESETS.find((preset: PresetConfig) => preset.name === "Fast");
      if (fastPreset) {
        applyPreset(fastPreset);
        toggleOption({
          type: 'preset',
          value: fastPreset.name,
          label: fastPreset.name,
          icon: fastPreset.icon
        });
      }
    }
  }, [availableModels]);

  // Add resize event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeState.isResizing) return;
      
      const newWidth = resizeState.startWidth + (e.clientX - resizeState.startX);
      // Limit the width between 320px and 640px
      const clampedWidth = Math.max(320, Math.min(640, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setResizeState(prev => ({ ...prev, isResizing: false }));
    };

    if (resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState]);

  // Debounced prompt update
  const debouncedPromptUpdate = useCallback(
    (value: string) => {
      handleParamChange('prompt', value);
      if (value.includes('\n')) {
        setRecentPrompts(prev => [{
          text: value.replace('\n', ''),
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
      }
    },
    []
  );

  // WebSocket cleanup
  useEffect(() => {
    return () => {
      // Cleanup other event listeners if any
    }
  }, [])

  // Add function to fetch available models
  const fetchAvailableModels = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_URL}/training/training-runs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch training runs')

      const trainings = await response.json()
      
      // Format models list
      const models: ModelPreset[] = trainings
        .filter((t: any) => t.status === 'succeeded' && t.version)
        .map((t: any) => ({
          id: t.version,
          name: t.trigger_word,
          description: "Custom trained model",
          icon: "user",
          version: t.version?.split(":")[-1]?.slice(0, 8) || 'Latest',
          type: 'custom' as const,
          created_at: t.created_at
        }))
      
      // Add base model
      models.push(...MODEL_PRESETS)
      
      setAvailableModels(models)
      
      // Set default model (prefer custom model if available)
      const customModel = models.find(m => m.type === 'custom')
      const modelToSelect = customModel || models.find(m => m.type === 'base')
      
      if (modelToSelect) {
        setSelectedModel(modelToSelect)
        setInferenceParams(prev => ({
          ...prev,
          model_id: modelToSelect.id
        }))
        toggleOption({
          type: 'model',
          value: modelToSelect.id,
          label: modelToSelect.name,
          icon: modelToSelect.icon
        })
      }

      // Apply Fast preset by default
      const fastPreset = PARAMETER_PRESETS.find(p => p.name === "Fast")
      if (fastPreset) {
        applyPreset(fastPreset)
        toggleOption({
          type: 'preset',
          value: fastPreset.name,
          label: fastPreset.name,
          icon: fastPreset.icon
        })
      }
    } catch (error) {
      console.error('Error fetching available models:', error)
      toast.error('Failed to load available models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const [recentPage, setRecentPage] = useState(0)
  const [hasMoreRecent, setHasMoreRecent] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchInferenceHistory = useCallback(async () => {
    if (isLoadingMore || !hasMoreRecent) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${ENDPOINTS.CANVAS_INFERENCE.LIST}?page=${recentPage}&limit=20`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch inference history');
      }

      const data = await response.json();
      
      // Add more robust validation of the response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Ensure inferences is an array, if not, set to empty array
      const inferences = Array.isArray(data.inferences) ? data.inferences : [];
      
      // Filter out unsuccessful runs and ensure output_urls exist
      const validResults = inferences.filter((result: InferenceResult) => 
        result && 
        result.status === 'completed' && 
        result.output_urls && 
        Array.isArray(result.output_urls) && 
        result.output_urls.length > 0
      ).map((result: InferenceResult) => ({
        ...result,
        isFavorite: result.output_urls ? isImageLiked(result.output_urls[0]) : false
      }));

      if (recentPage === 0) {
        setInferenceResults(validResults);
      } else {
        setInferenceResults(prev => [...prev, ...validResults]);
      }

      // Ensure has_more is a boolean
      setHasMoreRecent(!!data.has_more);
      setRecentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching inference history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
      toast.error('Failed to load inference history. Please try again.');
    } finally {
      setIsLoadingMore(false);
      setIsLoadingHistory(false);
      setInitialLoad(false);
    }
  }, [recentPage, isLoadingMore, hasMoreRecent, isImageLiked]);

  // Modify the useEffect for initial load to be more robust
  useEffect(() => {
    const loadInitialHistory = async () => {
      if (selectedTab === 'recent' && inferenceResults.length === 0 && !isLoadingHistory && !initialLoad) {
        setIsLoadingHistory(true);
        await fetchInferenceHistory();
      }
    };

    loadInitialHistory();
  }, [selectedTab, inferenceResults.length, isLoadingHistory, initialLoad, fetchInferenceHistory]);

  // Add a new useEffect to handle tab changes
  useEffect(() => {
    if (selectedTab === 'recent') {
      setRecentPage(0);
      setHasMoreRecent(true);
      setInferenceResults([]);
      setIsLoadingHistory(true);
      fetchInferenceHistory();
    }
  }, [selectedTab]);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('No authentication token found')

        // Check subscription status
        const response = await fetch(`${API_URL}/users/me/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!response.ok) throw new Error('Failed to fetch subscription status')

        const data = await response.json()
        setSubscription(data)

        // Fetch available models
        await fetchAvailableModels()

        // Initial fetch of inference history
        setIsLoadingHistory(true)
        await fetchInferenceHistory()

      } catch (error: any) {
        console.error('Error:', error)
        if (error.message && error.message.includes('token')) {
          router.push('/login')
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [user, router, authLoading])

  const handleParamChange = (key: keyof InferenceParams, value: string | number) => {
    setInferenceParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleError = (error: Error, context: string) => {
    console.error(`${context}:`, error);
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('token')) {
      message = 'Please log in again to continue';
      router.push('/login');
    } else if (error.message.includes('subscription')) {
      message = 'Please check your subscription status';
      router.push('/canvas');
    } else if (error.message.includes('inference')) {
      message = 'Failed to generate image. Please try again';
    }
    
    toast.error(message, {
      duration: 4000,
      position: 'bottom-center',
    });
  };

  // Add function to calculate estimated time based on parameters
  const calculateEstimatedTime = (params: InferenceParams) => {
    // Base time in seconds
    let baseTime = 10;
    
    // Adjust for inference steps
    baseTime += (params.num_inference_steps - 30) * 0.2;
    
    // Adjust for image size
    if (params.image_size === '1536x1536') baseTime *= 1.5;
    if (params.image_size === '1024x1024') baseTime *= 1.2;
    
    // Adjust for number of outputs
    baseTime *= params.num_outputs;
    
    return Math.round(baseTime);
  };

  const startInference = async () => {
    if (!inferenceParams.prompt) {
      toast.error('Please enter a prompt first', {
        duration: 3000,
        position: 'bottom-center',
      })
      return;
    }

    setIsSubmitting(true);
    setGenerationProgress(10);
    setSelectedTab('recent');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      // Clean and validate parameters
      const params = {
        prompt: inferenceParams.prompt.trim(),
        model_id: selectedModel?.id, // Add this line to pass the selected model ID
        image_size: inferenceParams.image_size || '1024x1024',
        num_outputs: Math.min(Math.max(1, inferenceParams.num_outputs || 1), 4),
        guidance_scale: Math.min(Math.max(1, inferenceParams.guidance_scale || 3), 20),
        prompt_strength: Math.min(Math.max(0, inferenceParams.prompt_strength || 0.8), 1),
        num_inference_steps: Math.min(Math.max(20, inferenceParams.num_inference_steps || 41), 100),
        aspect_ratio: inferenceParams.aspect_ratio || '1:1',
        extra_lora_scale: Math.min(Math.max(0, inferenceParams.extra_lora_scale || 1), 1),
        output_quality: Math.min(Math.max(1, inferenceParams.output_quality || 80), 100),
        training_id: selectedModel?.type === 'custom' ? selectedModel.id : undefined,
        extra_lora: inferenceParams.extra_lora || undefined,
        num_images: Math.min(Math.max(1, inferenceParams.num_outputs || 1), 4),
        prompt_upsampling: true
      };

      // If we need to remove the model field, we can do it safely now
      if ('model' in params) {
        delete params.model
      }

      // Create a temporary inference result for immediate feedback
      const tempInferenceId = Date.now().toString();
      const tempResults = Array.from({ length: params.num_outputs }, (_, index) => ({
        inference_id: `${tempInferenceId}-${index + 1}`,
        status: 'processing',
        output_urls: [],
        parameters: {
          ...params,
          image_index: index + 1,
          total_images: params.num_outputs
        },
        created_at: new Date().toISOString()
      }));

      // Add to results immediately to show loading state for each image
      setInferenceResults(prev => [...tempResults, ...prev]);
      setActiveInference(tempInferenceId);
      
      // Set initial progress and estimated time for each image
      const initialProgress = tempResults.reduce((acc, result) => ({
        ...acc,
        [result.inference_id]: loadingStates[0].progress
      }), {});
      
      setInferenceProgress(prev => ({ ...prev, ...initialProgress }));
      setEstimatedTime(prev => ({ 
        ...prev, 
        [tempInferenceId]: calculateEstimatedTime(params) 
      }));

      const response = await fetch(ENDPOINTS.CANVAS_INFERENCE.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Inference error:', errorData);
        
        // Remove the temporary result if there was an error
        setInferenceResults(prev => 
          prev.filter(inf => !inf.inference_id.startsWith(tempInferenceId))
        );

        // Handle insufficient credits error
        if (response.status === 402) {
          toast.error('Insufficient credits. Please purchase more credits to continue.', {
            duration: 4000,
            position: 'bottom-center',
          });
          router.push('/pricing#credits');
          return;
        }

        throw new Error(errorData.message || errorData.detail || 'Failed to generate image');
      }

      const result = await response.json();
      
      if (!result || !result.inference_id) {
        throw new Error('Invalid response from server');
      }
      
      // Create separate entries for each output URL
      if (result.output_urls && result.output_urls.length > 0) {
        // Remove all temporary results first
        setInferenceResults(prev => prev.filter(inf => !inf.inference_id.startsWith(tempInferenceId)));
        
        // Add individual entries for each output
        const newResults = result.output_urls.map((url: string, index: number) => ({
          ...result,
          inference_id: `${result.inference_id}-${index + 1}`,
          output_urls: [url],
          parameters: {
            ...result.parameters,
            image_index: index + 1,
            total_images: result.output_urls.length
          }
        }));
        
        setInferenceResults(prev => [...newResults, ...prev]);
      }
      
      setActiveInference(null);
      setGenerationProgress(100);
      
      toast.success('Images generated successfully!', {
        duration: 3000,
        position: 'bottom-center',
      });

    } catch (error: any) {
      console.error('Inference error:', error);
      
      // Remove the temporary result if there was an error
      setInferenceResults(prev => 
        prev.filter(inf => inf.inference_id !== activeInference)
      );
      
      // Show appropriate error message
      toast.error(error.message || 'Failed to generate image. Please try again.', {
        duration: 4000,
        position: 'bottom-center',
      });

      if (error.message?.includes('token')) {
        router.push('/login');
      }
    } finally {
      setIsSubmitting(false);
      setGenerationProgress(0);
      setActiveInference(null);
    }
  };

  // Add progress simulation effect
  useEffect(() => {
    if (!activeInference) return;

    const totalTime = estimatedTime[activeInference] * 1000; // convert to ms
    const interval = 100; // update every 100ms
    const steps = totalTime / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 95);
      
      setInferenceProgress(prev => ({
        ...prev,
        [activeInference]: progress
      }));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeInference, estimatedTime]);

  const applyPreset = (preset: PresetConfig) => {
    setInferenceParams(prev => ({
      ...prev,
      ...preset.params
    }))
    setSelectedPreset(preset.name)
  }

  const toggleOption = (option: SelectedOption) => {
    setSelectedOptions(prev => {
      const exists = prev.find(o => o.type === option.type && o.value === option.value)
      if (exists) {
        return prev.filter(o => o !== exists)
      }
      return [...prev.filter(o => o.type !== option.type), option]
    })
  }

  const removeOption = (option: SelectedOption) => {
    setSelectedOptions(prev => prev.filter(o => o !== option))
  }

  const handlePromptInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);
    setInputValue(value);
    
    // Update the actual inference params without debounce
    handleParamChange('prompt', value);
    setShowPromptGuide(false);

    // Preserve cursor position after state update
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(position, position);
      }
    });
  }, []);

  // Memoize filtered suggestions computation
  const computeFilteredSuggestions = useCallback((text: string, position: number) => {
    const textBeforeCursor = text.slice(0, position);
    const words = textBeforeCursor.split(' ');
    const currentWord = words[words.length - 1].toLowerCase();
    
    if (currentWord.length >= 2) {
      return PROMPT_SUGGESTIONS
        .filter((suggestion: PromptSuggestion) => suggestion.text.toLowerCase().includes(currentWord))
        .slice(0, 5); // Limit to 5 suggestions
    }
    return [];
  }, []);

  // Move suggestion filtering to a useEffect with debounced value
  useEffect(() => {
    if (!debouncedInputValue) {
      setShowSuggestions(false);
      return;
    }

    const suggestions = computeFilteredSuggestions(debouncedInputValue, cursorPosition);
    setFilteredSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [debouncedInputValue, cursorPosition, computeFilteredSuggestions]);

  // Memoize the applySuggestion function
  const applySuggestion = useCallback((suggestion: PromptSuggestion) => {
    if (!textareaRef.current) return;
    
    const value = textareaRef.current.value;
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const words = beforeCursor.split(' ');
    words.pop(); // Remove the partial word
    
    const newValue = `${words.join(' ')} ${suggestion.text} ${afterCursor}`.trim();
    handleParamChange('prompt', newValue);
    setShowSuggestions(false);
    
    // Focus back on textarea and preserve cursor position
    textareaRef.current.focus();
    const newPosition = beforeCursor.length + suggestion.text.length + 1; // +1 for the space
    
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    });
  }, [cursorPosition, handleParamChange]);

  // Model Creation Handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setModelCreation(prev => {
      if (acceptedFiles.length + prev.uploadedFiles.length > 20) {
        return { ...prev, error: 'Maximum 20 images allowed' };
      }
      return {
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...acceptedFiles],
        error: ''
      };
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880, // 5MB
  });

  const removeUploadedFile = (index: number) => {
    setModelCreation(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleModelCreation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      // Check subscription status first
      const subscriptionResponse = await fetch(`${API_URL}/users/me/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subscriptionData = await subscriptionResponse.json();

      if (subscriptionData.status !== 'active') {
        setShowPricingModal(true);
        return;
      }

      // Continue with existing validation
      if (modelCreation.uploadedFiles.length < 15) {
        setModelCreation(prev => ({ ...prev, error: 'Please upload at least 15 images' }));
        return;
      }
      if (!modelCreation.modelName.trim()) {
        setModelCreation(prev => ({ ...prev, error: 'Please enter a model name' }));
        return;
      }

      setModelCreation(prev => ({ ...prev, isUploading: true, error: '', uploadProgress: 0 }));

      // Use the chunked upload implementation
      const result = await uploadInChunks(
        modelCreation.uploadedFiles,
        modelCreation.modelName,
        (progress: number) => {
          setModelCreation(prev => ({ ...prev, uploadProgress: progress }));
        }
      );

      if (result.status === 'error') {
        throw new Error(result.message || 'Failed to upload files');
      }

      setModelCreation(prev => ({ ...prev, isTraining: true }));
      
      // Show a more detailed success message
      toast.success('Training started! Your model will be ready in about 30-45 minutes. You can continue using the app while it trains.', {
        duration: 6000,
      });
      
      // Close the modal but keep the training status
      setShowModelCreation(false);
      
      // Refresh available models after a short delay
      setTimeout(() => {
        fetchAvailableModels();
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Failed to start training';
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Database') || error.message.includes('MongoClient')) {
          errorMessage = 'Your model is being processed. You can check its status in the models list.';
          // Still close the modal since the upload likely succeeded
          setShowModelCreation(false);
          // Refresh models list to show new model
          setTimeout(() => {
            fetchAvailableModels();
          }, 2000);
        } else {
          errorMessage = error.message;
        }
      }
      
      setModelCreation(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setModelCreation(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    }
  };

  const [galleryView, setGalleryView] = useState<'grid' | 'single'>('grid')

  // Add this with other state declarations at the top of the CanvasPage component
  const [showPresetSelect, setShowPresetSelect] = useState(false);

  // Add new interface for loading states
  interface LoadingState {
    emoji: string;
    description: string;
    progress: number;
  }

  const loadingStates: LoadingState[] = [
    { emoji: "🎨", description: "Preparing your canvas...", progress: 10 },
    { emoji: "✨", description: "Gathering creative inspiration...", progress: 25 },
    { emoji: "🖼️", description: "Crafting initial composition...", progress: 40 },
    { emoji: "🎯", description: "Refining the details...", progress: 60 },
    { emoji: "🌟", description: "Adding finishing touches...", progress: 80 },
    { emoji: "✅", description: "Almost there...", progress: 95 }
  ];

  // Add state for current loading state
  const [currentLoadingState, setCurrentLoadingState] = useState<LoadingState>(loadingStates[0]);

  // Update useEffect for progress simulation
  useEffect(() => {
    if (!activeInference) return;

    const totalTime = estimatedTime[activeInference] * 1000; // convert to ms
    const interval = totalTime / loadingStates.length;
    let currentIndex = 0;

    const timer = setInterval(() => {
      currentIndex++;
      if (currentIndex < loadingStates.length) {
        setCurrentLoadingState(loadingStates[currentIndex]);
        // Update both the inference progress and generation progress
        const progress = loadingStates[currentIndex].progress;
        setInferenceProgress(prev => ({
          ...prev,
          [activeInference]: progress
        }));
        setGenerationProgress(progress);

        // Update progress for all temporary results
        const tempResults = inferenceResults
          .filter(result => result.inference_id.startsWith(activeInference))
          .forEach(result => {
            setInferenceProgress(prev => ({
              ...prev,
              [result.inference_id]: progress
            }));
          });
      }

      if (currentIndex >= loadingStates.length) {
        clearInterval(timer);
      }
    }, interval);

    return () => {
      clearInterval(timer);
      setCurrentLoadingState(loadingStates[0]);
      setGenerationProgress(0);
    };
  }, [activeInference, estimatedTime, inferenceResults]);

  // Move displayResults calculation outside of renderGalleryContent
  const getDisplayResults = () => {
    return selectedTab === 'recent' 
      ? inferenceResults
      : favorites.map(fav => ({
          inference_id: fav.id,
          output_urls: [fav.imageUrl],
          parameters: { 
            prompt: fav.prompt || '',
            image_size: '1024x1024'
          },
          created_at: fav.timestamp,
          status: 'completed',
          isFavorite: true
        }));
  };

  const renderGalleryContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setRecentPage(0);
              setHasMoreRecent(true);
              setIsLoadingHistory(true);
              fetchInferenceHistory();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (isLoadingHistory && selectedTab === 'recent' && inferenceResults.length === 0) {
      return (
        <div className={`${
          galleryView === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'
            : 'flex flex-col gap-4 max-w-3xl mx-auto'
        }`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (selectedTab === 'feed') {
      return (
        <FeedExamples 
          onSelectImage={(example, index, allExamples) => {
            setFeedExamples(allExamples);
            const validExamples = allExamples.filter(e => e.output_urls && e.output_urls.length > 0);
            const validIndex = validExamples.findIndex(e => e._id === example._id);
            setSelectedImageIndex(validIndex);
            setSelectedResult({
              inference_id: example._id,
              output_urls: example.output_urls,
              parameters: {
                prompt: example.prompt,
                image_size: '1024x1024'
              },
              created_at: example.created_at,
              status: 'completed',
              isFavorite: isImageLiked(example.output_urls?.[0] || ''),
              prompt: example.prompt
            });
          }}
          galleryView={galleryView}
          onLike={(example) => {
            handleLikeImage({
              inference_id: example._id,
              output_urls: example.output_urls,
              parameters: {
                prompt: example.prompt,
                image_size: '1024x1024'
              },
              created_at: example.created_at,
              status: 'completed',
              isFavorite: isImageLiked(example.output_urls?.[0] || ''),
              prompt: example.prompt
            });
          }}
          isLiked={isImageLiked}
        />
      );
    }

    if (selectedTab === 'recent' && !isLoadingHistory && inferenceResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-medium mb-2">No images yet</h3>
          <p className="text-sm mb-4">Start by generating your first image above</p>
          <button
            onClick={() => setShowSidebar(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Settings
          </button>
        </div>
      );
    }

    const displayResults = getDisplayResults();

    return (
      <>
        <div className={`${
          galleryView === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'
            : 'flex flex-col gap-4 max-w-3xl mx-auto'
        }`}>
          {displayResults.map((result: InferenceResult, index: number) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={result.inference_id}
              className={`bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer ${
                galleryView === 'single' ? 'max-w-3xl mx-auto w-full' : ''
              }`}
              onClick={() => {
                const hasValidUrls = result.output_urls && result.output_urls.length > 0;
                if (hasValidUrls) {
                  const validResults = displayResults.filter(r => 
                    r.output_urls && 
                    r.output_urls.length > 0
                  );
                  const validIndex = validResults.findIndex(r => r.inference_id === result.inference_id);
                  
                  if (validIndex !== -1) {
                    setSelectedImageIndex(validIndex);
                    setSelectedResult(result);
                  }
                }
              }}
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 relative group">
                {result.output_urls?.[0] ? (
                  <>
                    <img
                      src={result.output_urls[0]}
                      alt={result.parameters?.prompt}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                    {/* Prompt Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                      <p className="text-white text-sm line-clamp-2">
                        {result.parameters?.prompt || result.prompt}
                      </p>
                    </div>
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result.output_urls?.[0]) {
                              const link = document.createElement('a');
                              link.href = result.output_urls[0];
                              link.download = `image-${result.inference_id}.png`;
                              link.click();
                            }
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          aria-label="Download image"
                        >
                          <FiDownload className="text-gray-700" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeImage(result);
                          }}
                          className={`p-2 bg-white rounded-full hover:bg-gray-100 transition-colors ${
                            result.isFavorite ? 'text-red-500' : 'text-gray-700'
                          }`}
                          aria-label="Like image"
                        >
                          <FiHeart className={`${result.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-4">
                    <div className="text-center">
                      <span className="text-3xl">{currentLoadingState.emoji}</span>
                      <p className="mt-2 text-sm text-gray-600">{currentLoadingState.description}</p>
                    </div>
                    <div className="w-full max-w-[200px]">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${inferenceProgress[result.inference_id] || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-2">
                        {Math.round(inferenceProgress[result.inference_id] || 0)}% Complete
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading indicator */}
        {selectedTab === 'recent' && (
          <div ref={loadMoreRef} className="col-span-full py-4">
            {isLoadingMore && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  // Use a single ref with useInView for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && selectedTab === 'recent' && !isLoadingMore && hasMoreRecent) {
      fetchInferenceHistory();
    }
  }, [inView, selectedTab, fetchInferenceHistory, isLoadingMore, hasMoreRecent]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !subscription || subscription.status !== 'active') {
    return null
  }

  return (
    <div className="h-screen bg-gray-50 relative flex flex-col">
      {/* Top Bar with Settings and Prompt */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        {/* Settings and Title Row */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium">Canvas</h1>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              {selectedModel && (
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelect(prev => !prev)}
                    className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {selectedModel.icon === 'camera' ? (
                      <FiCamera className="text-blue-600 w-4 h-4" />
                    ) : (
                      <FiUser className="text-purple-600 w-4 h-4" />
                    )}
                    <span className="text-sm text-gray-600">{selectedModel.name}</span>
                    <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showModelSelect ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Add the model selection dropdown */}
                  <AnimatePresence>
                    {showModelSelect && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        {availableModels.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setInferenceParams(prev => ({
                                ...prev,
                                model_id: model.id
                              }));
                              toggleOption({
                                type: 'model',
                                value: model.id,
                                label: model.name,
                                icon: model.icon
                              });
                              setShowModelSelect(false);
                            }}
                            className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                              selectedModel?.id === model.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {model.icon === 'camera' ? (
                              <FiCamera className={selectedModel?.id === model.id ? 'text-blue-600' : 'text-gray-500'} />
                            ) : (
                              <FiUser className={selectedModel?.id === model.id ? 'text-purple-600' : 'text-gray-500'} />
                            )}
                            <div>
                              <div className="font-medium text-sm truncate max-w-[200px]">{model.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">v{model.version}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {selectedPreset && (
                <>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPresetSelect(prev => !prev);
                      }}
                      className="flex items-center gap-1.5 p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {selectedPreset === "Fast" ? (
                        <FiZap className="text-yellow-500 w-4 h-4" />
                      ) : (
                        <FiCamera className="text-blue-600 w-4 h-4" />
                      )}
                      <span className="text-sm text-gray-600">{selectedPreset}</span>
                      <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPresetSelect ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Add Preset Selection Dropdown */}
                    <AnimatePresence>
                      {showPresetSelect && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                        >
                          {PARAMETER_PRESETS.map((preset: PresetConfig) => (
                            <button
                              key={preset.name}
                              onClick={(e) => {
                                e.stopPropagation();
                                applyPreset(preset)
                                toggleOption({
                                  type: 'preset',
                                  value: preset.name,
                                  label: preset.name,
                                  icon: preset.icon
                                })
                                setShowPresetSelect(false);
                              }}
                              className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                                selectedPreset === preset.name ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              {preset.icon === 'zap' ? (
                                <FiZap className={selectedPreset === preset.name ? 'text-yellow-500' : 'text-gray-500'} />
                              ) : (
                                <FiCamera className={selectedPreset === preset.name ? 'text-blue-600' : 'text-gray-500'} />
                              )}
                              <div>
                                <div className="font-medium text-sm truncate max-w-[200px]">{preset.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{preset.description}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5 text-gray-600"
          >
            <FiSettings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>

        {/* Prompt Input Row */}
        <div className="px-4 pb-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inferenceParams.prompt}
              onChange={handlePromptInput}
              onFocus={() => setShowPromptGuide(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSuggestions(false);
                } else if (e.key === 'Tab' && showSuggestions && filteredSuggestions.length > 0) {
                  e.preventDefault();
                  applySuggestion(filteredSuggestions[0]);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const text = e.currentTarget.value;
                  setRecentPrompts(prev => [{
                    text: text.replace('\n', ''),
                    timestamp: new Date().toISOString()
                  }, ...prev.slice(0, 9)]);
                }
              }}
              className="w-full px-4 py-3 pr-[100px] border border-gray-300 rounded-lg shadow-sm 
              focus:ring-blue-500 focus:border-blue-500 transition-shadow hover:border-blue-200 
              text-sm min-h-[80px] outline-none text-gray-900 resize-none"
              placeholder={selectedModel?.type === 'custom' ? 
                `Try: 'A professional photo of ${selectedModel.name} in a business suit...'` : 
                "Try: 'A hyperrealistic portrait of a person in a cyberpunk setting...'"
              }
            />
            
            {/* Generate Button */}
            <button
              onClick={startInference}
              disabled={isSubmitting || !inferenceParams.prompt}
              className="absolute right-2 bottom-2 h-9 w-9 bg-blue-600 text-white rounded-full 
              hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed 
              text-sm font-medium flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiArrowUp className="w-4 h-4" />
                  {inferenceParams.num_outputs > 1 && (
                    <div className="absolute -top-2 -right-2 bg-white text-blue-600 text-xs 
                    rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                      {inferenceParams.num_outputs}x
                    </div>
                  )}
                </>
              )}
            </button>

            {/* Model Name Suggestion */}
            {selectedModel?.type === 'custom' && !inferenceParams.prompt.toLowerCase().includes(selectedModel.name.toLowerCase()) && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                <FiInfo className="w-3.5 h-3.5" />
                <span>Include "<span className="text-blue-600 font-medium">{selectedModel.name}</span>" in your prompt to use this model</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-4 lg:p-8">
          {/* Gallery Content */}
          {renderGalleryContent()}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          {/* View Toggle Button - Icon Only */}
          <button 
            onClick={() => setGalleryView(galleryView === 'grid' ? 'single' : 'grid')}
            className="p-2 rounded-md transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label={`Switch to ${galleryView === 'grid' ? 'single' : 'grid'} view`}
          >
            {galleryView === 'grid' ? (
              <FiMaximize className="w-4 h-4" />
            ) : (
              <FiGrid className="w-4 h-4" />
            )}
          </button>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleTabChange('recent')}
              className={`p-2 rounded-md transition-colors flex items-center gap-1.5 ${
                selectedTab === 'recent' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FiClock className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleTabChange('favorites')}
              className={`p-2 rounded-md transition-colors flex items-center gap-1.5 ${
                selectedTab === 'favorites' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FiStar className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleTabChange('feed')}
              className={`p-2 rounded-md transition-colors flex items-center gap-1.5 ${
                selectedTab === 'feed' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span role="img" aria-label="light bulb" className="text-lg">😍</span>
              <span className="text-sm font-medium">Get inspired</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowSidebar(false)}
            />
            
            {/* Settings Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl 
              max-h-[90vh] overflow-y-auto lg:w-[420px] lg:right-0 lg:left-auto lg:top-0 
              lg:rounded-none lg:max-h-screen lg:h-full lg:border-l border-gray-200
              lg:translate-x-0 lg:transform-none"
            >
              {/* Header - Always Visible */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <h2 className="text-lg font-medium flex items-center">
                  <FiSliders className="mr-2" /> Canvas Settings
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              {/* Settings Content - Scrollable */}
              <div className="overflow-y-auto p-4">
                <div className="space-y-6 pb-safe">
                  {/* Selected Options */}
                  <AnimatePresence>
                    <motion.div className="flex flex-wrap gap-2">
                      {selectedOptions.map((option) => (
                        <motion.div
                          key={`${option.type}-${option.value}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm"
                        >
                          {option.type === 'model' && <FiCamera className="mr-1.5" />}
                          {option.type === 'preset' && (
                            option.icon === 'zap' ? <FiZap className="mr-1.5" /> : <FiCamera className="mr-1.5" />
                          )}
                          {option.label}
                          <button
                            onClick={() => removeOption(option)}
                            className="ml-1.5 hover:text-blue-800"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Model Selection with Enhanced Visual Feedback */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Model</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Create New Model Card */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowModelCreation(true)}
                        className="p-3 border-dashed border-2 border-gray-200 rounded-lg text-left transition-all hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex items-center mb-1">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2">
                            <FiPlus className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Create New Model</div>
                            <div className="text-xs text-gray-500">Train with your photos</div>
                          </div>
                        </div>
                      </motion.button>

                      {isLoadingModels ? (
                        // Loading skeleton
                        Array(2).fill(0).map((_, i) => (
                          <div key={i} className="p-3 border rounded-lg animate-pulse">
                            <div className="flex items-center mb-1">
                              <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                              <div className="space-y-1">
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                <div className="h-3 w-12 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        availableModels.map(model => (
                          <motion.button
                            key={model.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedModel(model)
                              setInferenceParams(prev => ({
                                ...prev,
                                model_id: model.id
                              }))
                              toggleOption({
                                type: 'model',
                                value: model.id,
                                label: model.name,
                                icon: model.icon
                              })
                            }}
                            className={`p-3 border rounded-lg text-left transition-all hover:shadow-md ${
                              selectedModel?.id === model.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                                model.type === 'base' ? 'bg-blue-100' : 'bg-purple-100'
                              }`}>
                                {model.icon === 'camera' ? (
                                  <FiCamera className="text-blue-600" />
                                ) : (
                                  <FiUser className="text-purple-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-sm truncate max-w-[200px]">{model.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">v{model.version}</div>
                              </div>
                            </div>
                            {model.type === 'custom' && model.created_at && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <FiClock className="mr-1" />
                                {new Date(model.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </motion.button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quality Presets */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-3">Quality Preset</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PARAMETER_PRESETS.map((preset: PresetConfig) => (
                        <motion.button
                          key={preset.name}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyPreset(preset)
                            toggleOption({
                              type: 'preset',
                              value: preset.name,
                              label: preset.name,
                              icon: preset.icon
                            })
                            setShowPresetSelect(false);
                          }}
                          className={`p-3 border rounded-lg text-left transition-all hover:shadow-md ${
                            selectedOptions.some(o => o.type === 'preset' && o.value === preset.name)
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center min-w-0">
                              {preset.icon === 'zap' ? (
                                <FiZap className="text-yellow-500 mr-2 flex-shrink-0" />
                              ) : (
                                <FiCamera className="text-blue-500 mr-2 flex-shrink-0" />
                              )}
                              <div className="font-medium text-sm truncate">{preset.name}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">{preset.description}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio - Moved here */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-3">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_RATIOS.map((ratio: string) => (
                        <button
                          key={ratio}
                          onClick={() => {
                            handleParamChange('aspect_ratio', ratio)
                            toggleOption({
                              type: 'aspect',
                              value: ratio,
                              label: ratio
                            })
                          }}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            inferenceParams.aspect_ratio === ratio
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Mode Toggle */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-700">Advanced Mode</h3>
                        <Tooltip content="Access additional parameters and fine-tune your generation">
                          <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <button
                        onClick={() => setIsAdvancedMode(prev => !prev)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isAdvancedMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isAdvancedMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isAdvancedMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6 overflow-hidden"
                        >
                          {/* Guidance Scale */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Guidance Scale
                                </label>
                                <Tooltip content={PARAMETER_DESCRIPTIONS.guidance_scale}>
                                  <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                              <span className="text-sm text-gray-500">
                                {inferenceParams.guidance_scale}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              step="0.1"
                              value={inferenceParams.guidance_scale}
                              onChange={(e) => handleParamChange('guidance_scale', parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>More Creative</span>
                              <span>More Accurate</span>
                            </div>
                          </div>

                          {/* Prompt Strength */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Prompt Strength
                                </label>
                                <Tooltip content={PARAMETER_DESCRIPTIONS.prompt_strength}>
                                  <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                              <span className="text-sm text-gray-500">
                                {inferenceParams.prompt_strength}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={inferenceParams.prompt_strength}
                              onChange={(e) => handleParamChange('prompt_strength', parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Subtle</span>
                              <span>Strong</span>
                            </div>
                          </div>

                          {/* Inference Steps */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Inference Steps
                                </label>
                                <Tooltip content={PARAMETER_DESCRIPTIONS.num_inference_steps}>
                                  <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                              <span className="text-sm text-gray-500">
                                {inferenceParams.num_inference_steps}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="100"
                              step="1"
                              value={inferenceParams.num_inference_steps}
                              onChange={(e) => handleParamChange('num_inference_steps', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Faster</span>
                              <span>Better Quality</span>
                            </div>
                          </div>

                          {/* Output Quality */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Output Quality
                                </label>
                                <Tooltip content={PARAMETER_DESCRIPTIONS.output_quality}>
                                  <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                              <span className="text-sm text-gray-500">
                                {inferenceParams.output_quality}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              step="1"
                              value={inferenceParams.output_quality}
                              onChange={(e) => handleParamChange('output_quality', parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Smaller Size</span>
                              <span>Better Quality</span>
                            </div>
                          </div>

                          {/* Extra LoRA Input */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Extra LoRA
                                </label>
                                <Tooltip content={PARAMETER_DESCRIPTIONS.extra_lora}>
                                  <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                                </Tooltip>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={inferenceParams.extra_lora || ''}
                              onChange={(e) => handleParamChange('extra_lora', e.target.value)}
                              placeholder="Enter LoRA URL or model ID"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {inferenceParams.extra_lora && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    LoRA Strength
                                  </label>
                                  <span className="text-sm text-gray-500">
                                    {inferenceParams.extra_lora_scale}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={inferenceParams.extra_lora_scale}
                                  onChange={(e) => handleParamChange('extra_lora_scale', parseFloat(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Prompt Section with Recent Prompts */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Prompt</label>
                      {recentPrompts.length > 0 && (
                        <button
                          onClick={() => setShowRecentPrompts(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Recent Prompts
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={inferenceParams.prompt}
                        onChange={handlePromptInput}
                        onFocus={() => setShowPromptGuide(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowSuggestions(false);
                          } else if (e.key === 'Tab' && showSuggestions && filteredSuggestions.length > 0) {
                            e.preventDefault();
                            applySuggestion(filteredSuggestions[0]);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const text = e.currentTarget.value;
                            setRecentPrompts(prev => [{
                              text: text.replace('\n', ''),
                              timestamp: new Date().toISOString()
                            }, ...prev.slice(0, 9)]);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow hover:border-blue-200 text-sm min-h-[80px] outline-none text-gray-900"
                        placeholder={selectedModel?.type === 'custom' ? 
                          `Try: 'A professional photo of ${selectedModel.name} in a business suit...'` : 
                          "Try: 'A hyperrealistic portrait of a person in a cyberpunk setting...'"
                        }
                      />
                      
                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50"
                          >
                            {filteredSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => applySuggestion(suggestion)}
                                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between group"
                              >
                                <span className="text-gray-700">{suggestion.text}</span>
                                <span className="text-xs text-gray-400 group-hover:text-blue-500">
                                  {suggestion.category}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Existing prompt guide */}
                      <AnimatePresence>
                        {isFirstVisit && showPromptGuide && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-1 left-7 transform -translate-x-1/2 bg-blue-600 bg-opacity-60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm whitespace-nowrap shadow-sm"
                          >
                            Start by describing your image here
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Generate Button with Progress */}
                  <div className="space-y-2">
                    <button
                      onClick={startInference}
                      disabled={isSubmitting || !inferenceParams.prompt}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:bg-blue-300 disabled:scale-100 font-medium shadow-sm hover:shadow-md"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-xl">{currentLoadingState.emoji}</span>
                          <span>{currentLoadingState.description}</span>
                        </div>
                      ) : (
                        'Generate Image'
                      )}
                    </button>
                    {isSubmitting && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${currentLoadingState.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-center text-sm text-gray-500">
                          {currentLoadingState.progress}% Complete
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Number of Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Number of Images
                        </label>
                        <Tooltip content="Number of images to generate in one run">
                          <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <span className="text-sm text-gray-500">
                        {inferenceParams.num_outputs}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={inferenceParams.num_outputs}
                      onChange={(e) => handleParamChange('num_outputs', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Single Image</span>
                      <span>Multiple Images</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {selectedImageIndex !== null && selectedResult && (
          <ImageViewer
            images={selectedTab === 'feed' 
              ? feedExamples
                  .filter(r => r.output_urls && r.output_urls.length > 0)
                  .map(r => r.output_urls?.[0] || '')
              : getDisplayResults()
                  .filter(r => r.output_urls && r.output_urls.length > 0)
                  .map(r => r.output_urls?.[0] || '')
            }
            currentIndex={selectedImageIndex}
            prompt={selectedResult.parameters?.prompt || selectedResult.prompt}
            onClose={() => {
              setSelectedImageIndex(null);
              setSelectedResult(null);
            }}
            onNavigate={(index) => {
              const validResults = selectedTab === 'feed'
                ? feedExamples.filter(r => r.output_urls && r.output_urls.length > 0)
                : getDisplayResults().filter(r => r.output_urls && r.output_urls.length > 0);
              
              setSelectedImageIndex(index);
              const nextResult = validResults[index];
              setSelectedResult({
                ...nextResult,
                parameters: {
                  ...nextResult.parameters,
                  prompt: nextResult.parameters?.prompt || nextResult.prompt
                },
                isFavorite: isImageLiked(nextResult.output_urls?.[0] || '')
              });
            }}
            onLike={() => {
              if (selectedResult) {
                handleLikeImage(selectedResult);
              }
            }}
            isLiked={selectedResult?.output_urls ? isImageLiked(selectedResult.output_urls[0]) : false}
          />
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            {/* Add help content */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Prompts Modal */}
      <AnimatePresence>
        {showRecentPrompts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowRecentPrompts(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Prompts</h3>
                <button
                  onClick={() => setShowRecentPrompts(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleParamChange('prompt', prompt.text)
                      setShowRecentPrompts(false)
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-sm mb-1 line-clamp-2">{prompt.text}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(prompt.timestamp).toLocaleString()}
                    </div>
                  </button>
                ))}
                {recentPrompts.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No recent prompts yet
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model Creation Modal */}
      <AnimatePresence>
        {showModelCreation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModelCreation(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col max-h-[90vh]">
                {/* Model Creation Form */}
                <div className="p-6 border-b">
                  <div className="mb-6">
                    <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-1">
                      Model Name (Remember: This will trigger your image generation)
                    </label>
                    <input
                      type="text"
                      id="modelName"
                      value={modelCreation.modelName}
                      onChange={(e) => setModelCreation(prev => ({ ...prev, modelName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a name for your model"
                    />  
                  </div>

                  {modelCreation.isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading files...</span>
                        <span>{modelCreation.uploadProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${modelCreation.uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {modelCreation.error && (
                    <div className="mt-4 text-red-600 text-sm">{modelCreation.error}</div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowModelCreation(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleModelCreation}
                      disabled={modelCreation.isUploading || modelCreation.uploadedFiles.length < 15 || !modelCreation.modelName.trim()}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${
                        (modelCreation.isUploading || modelCreation.uploadedFiles.length < 15 || !modelCreation.modelName.trim())
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-blue-700'
                      }`}
                    >
                      {modelCreation.isUploading ? 'Uploading...' : 'Create Model'}
                    </button>
                  </div>
                </div>

                {/* Image Upload Instructions */}
                <div className="flex-1 overflow-y-auto">
                  <ImageUploadInstructions
                    uploadedFiles={modelCreation.uploadedFiles}
                    setUploadedFiles={(files) => setModelCreation(prev => ({ ...prev, uploadedFiles: files }))}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4 my-8"
            >
              <div className="p-6 flex justify-between items-center border-b">
                <h2 className="text-2xl font-semibold">Upgrade to Continue</h2>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Create Unlimited AI Models
                  </h3>
                  <p className="text-gray-600">
                    Subscribe to unlock the ability to create and train your own custom AI models
                  </p>
                </div>
                <Pricing />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 