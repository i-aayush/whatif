'use client'

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ImageUploadInstructions from '../components/ImageUploadInstructions';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { API_URL } from '../config/config';
import { useRouter } from 'next/navigation';

export default function GetStarted() {
  const { user } = useAuth();
  const router = useRouter();
  const [modelName, setModelName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + uploadedFiles.length > 20) {
      setError('Maximum 20 images allowed');
      return;
    }
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    setError('');
  }, [uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880, // 5MB
  });

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to continue');
      router.push('/login');
      return;
    }

    if (uploadedFiles.length < 15) {
      setError('Please upload at least 15 images');
      return;
    }
    if (!modelName.trim()) {
      setError('Please enter a model name');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create FormData
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('model_name', modelName);

      // Upload files and start training
      const response = await fetch(`${API_URL}/training/upload-and-train`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again');
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start training');
      }

      const data = await response.json();
      setIsTraining(true);
      toast.success('Training started successfully! We will notify you when it\'s complete.');
      
    } catch (err) {
      console.error('Error:', err);
      if (err instanceof Error && err.message === 'Authentication token not found') {
        toast.error('Please log in to continue');
        router.push('/login');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start training';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Upload Form */}
      <aside className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
              Model Name
            </label>
            <input
              type="text"
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter a name for your model"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (15-20 photos)
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
            >
              <input {...getInputProps()} />
              <p className="text-gray-600">Drag & drop images here, or click to select</p>
              <p className="text-sm text-gray-500">
                {uploadedFiles.length}/20 images uploaded
              </p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Uploaded Images:</p>
              <div className="max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isUploading || isTraining}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isUploading || isTraining ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isUploading ? 'Uploading...' : isTraining ? 'Training Started' : 'Start Training'}
          </button>

          {isTraining && (
            <div className="text-sm text-gray-600 text-center">
              Training will take approximately 30-60 minutes. We'll notify you when it's complete.
            </div>
          )}
        </form>
      </aside>

      {/* Right Content - Instructions */}
      <main className="flex-1 overflow-y-auto p-6">
        <ImageUploadInstructions />
      </main>
    </div>
  );
} 