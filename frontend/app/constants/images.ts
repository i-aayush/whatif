// S3 bucket base URL
export const S3_BASE_URL = 'https://whatif-genai.s3.amazonaws.com';

// Example images for the carousel
export const CAROUSEL_IMAGES = [
  'https://replicate.delivery/czjl/45u7FCzvbU4iFxEGRJ118utg1inYqsPemFtwtPvdBtpn7bCKA/tmp1ckqay7a.jpg',
  'https://replicate.delivery/czjl/FCDm4HKdu86yN9iC6H2IeKG5CO81ZZnbrWi6sph5ref4svJoA/tmpgozxzev7.jpg',
  'https://replicate.delivery/czjl/AfaxgE6W0pUeRUS0znWuuqJ3uuHozxsGrVAiRHLq1tHB53EUA/tmpc9l8mw43.jpg',
  'https://replicate.delivery/czjl/cONRAUa9fv27di8Jstr1KffJVcVSpvIORnKIK1PGB24DpvJoA/tmp6os8pte8.jpg',
  'https://replicate.delivery/czjl/S5FaUpztxnIHExzTeJ8XkrQLjJlblaJWrsUWQQvkpMC98bCKA/tmp2j3qdd9y.jpg',
  'https://replicate.delivery/xezq/IDnHpRv5MIbQLtB4njXrW7d3BMqZfkUeyVyUEUFtjAflLwJoA/out-1.png',
  'https://replicate.delivery/czjl/nYzcWtCpzr4uIV3HVX4Ie6BZTwYaHcBwXuOrFMrEqWu55bCKA/tmpvei9fste.jpg',
  'https://replicate.delivery/czjl/mUfh1mnpreujVUpqbcrnFPHhwTM9dffVwRRyKgNfNRvq6AngC/tmpjaqkg921.png'
];

// Before/After example images
export const BEFORE_IMAGES = [
  "https://whatif-genai.s3.amazonaws.com/prompt_images/IMG_1042.jpg",
  "https://whatif-genai.s3.amazonaws.com/prompt_images/IMG_1044.jpg", 
  "https://whatif-genai.s3.amazonaws.com/prompt_images/IMG_1050.jpg",
  "https://whatif-genai.s3.amazonaws.com/prompt_images/IMG_1055.jpg"
];

// After images from replicate
export const AFTER_IMAGES = {
  corporate: 'https://whatif-genai.s3.us-east-1.amazonaws.com/prompt_images/out-0.webp',
  fashion: 'https://whatif-genai.s3.amazonaws.com/prompt_images/old_money.png',
  travel: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/out-1%20(1)-wKPB041GtFPoxyo06N9ookHzT1KAZW.png"

};

// Placeholder image for loading/error states
export const PLACEHOLDER_IMAGE = '/placeholder-image.jpg'; 