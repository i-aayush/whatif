import React from 'react';

const ImageUploadInstructions: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Photo Upload Requirements</h1>
      <p className="text-center text-gray-600 mb-6">To ensure the best results, follow these photo requirements when uploading your images.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/group.png" alt="No Group Photos" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No group photos:</span> Please upload only individual photos of yourself.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/blurry.png" alt="No Low Resolution" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No blurry or low-resolution photos:</span> Ensure your face is clear and in focus.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/hats.png" alt="No Hats or Caps" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No caps or hats:</span> Avoid covering your head unless for medical or religious reasons.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/poses.png" alt="No Silly Faces" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No silly faces:</span> Use natural expressions without exaggerated poses.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/car_selfie.png" alt="No Car Selfies" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No car selfies:</span> Avoid taking photos in vehicles or in mirrors.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/nude.png" alt="No Nudity" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">No nudity:</span> Ensure appropriate clothing in all images.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/clothes.png" alt="Upload Recent Photos" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">Upload recent photos:</span> Use photos that reflect your current appearance.</p>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <img src="https://whatif-genai.s3.amazonaws.com/prompt_images/clothes1.png" alt="Variety in Backgrounds" className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto" />
          <p><span className="text-red-500 font-bold">Variety in backgrounds and clothing:</span> Upload photos with different settings and outfits.</p>
        </div>
      </div>

      <p className="text-center text-green-600 mt-6">Once you're ready, proceed with the upload to start fine-tuning your model!</p>
    </div>
  );
};

export default ImageUploadInstructions;