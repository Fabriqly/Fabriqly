'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Trash2,
  Star,
  RotateCcw
} from 'lucide-react';

interface ImageUploaderProps {
  productId: string;
  onImagesUploaded?: (images: any[]) => void;
  existingImages?: any[];
  maxImages?: number;
}

export function ImageUploader({ 
  productId, 
  onImagesUploaded, 
  existingImages = [],
  maxImages = 10 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - existingImages.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length < fileArray.length) {
      alert(`Only ${remainingSlots} images can be uploaded. Maximum ${maxImages} images allowed.`);
    }

    await uploadImages(filesToUpload);
  };

  const uploadImages = async (files: File[]) => {
    if (!productId) {
      console.error('No product ID provided for image upload');
      alert('No product ID available for image upload');
      return;
    }
    
    console.log('Uploading images for product:', productId);
    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('Image upload response:', responseText);
        
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        
        try {
          const data = JSON.parse(responseText);
          onImagesUploaded?.(data.images);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text:', responseText);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const responseText = await response.text();
        console.error('Upload failed:', response.status, responseText);
        
        let errorMessage = 'Failed to upload images';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from existing images
        const updatedImages = existingImages.filter(img => img.id !== imageId);
        onImagesUploaded?.(updatedImages);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(error.message || 'Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (response.ok) {
        // Update existing images
        const updatedImages = existingImages.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }));
        onImagesUploaded?.(updatedImages);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set primary image');
      }
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      alert(error.message || 'Failed to set primary image');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-400">
            <Upload className="w-12 h-12 mx-auto" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Product Images
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, GIF up to 5MB each
            </p>
          </div>

          <Button
            type="button"
            onClick={openFileDialog}
            disabled={uploading || existingImages.length >= maxImages}
            variant="outline"
          >
            {uploading ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose Images
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Product Images ({existingImages.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Primary
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {!image.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSetPrimary(image.id)}
                        className="bg-white text-gray-900 hover:bg-gray-100"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleDeleteImage(image.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600 truncate">
                    {image.altText || `Image ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Order: {image.sortOrder}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <RotateCcw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800">Uploading images...</span>
          </div>
        </div>
      )}
    </div>
  );
}

