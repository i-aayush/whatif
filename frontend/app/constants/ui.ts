// Image size options
export const IMAGE_SIZES = ['512x512', '768x768', '1024x1024', '1536x1536'] as const;

// Aspect ratio options
export const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const;

// Sidebar configuration
export const SIDEBAR = {
  DEFAULT_WIDTH: 384,
  MIN_WIDTH: 320,
  MAX_WIDTH: 480
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVE: 'Successfully saved!',
    UPDATE: 'Successfully updated!',
    DELETE: 'Successfully deleted!',
    UPLOAD: 'Successfully uploaded!'
  },
  ERROR: {
    GENERIC: 'An error occurred. Please try again.',
    UPLOAD: 'Failed to upload. Please try again.',
    NETWORK: 'Network error. Please check your connection.'
  }
} as const; 