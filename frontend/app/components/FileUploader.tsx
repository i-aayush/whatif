import React, { useRef } from 'react';

interface FileUploaderProps {
  onFileSelect: (files: FileList | null) => void;
  isUploading?: boolean;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isUploading = false,
  accept = 'image/*',
  multiple = true,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const baseClasses = 'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer';
  const stateClasses = isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-500';
  const finalClasses = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <div
      className={finalClasses}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onFileSelect(e.target.files)}
        disabled={isUploading}
      />
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              Drag and drop your images here, or <span className="text-blue-500">browse</span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-500">
          Supported formats: JPG, PNG, WEBP (max 10MB per file)
        </p>
      </div>
    </div>
  );
}; 