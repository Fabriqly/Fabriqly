'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { ProductImage } from '@/types/products';

interface ImageUploaderProps {
  productId: string;
  onImagesUploaded?: (images: ProductImage[]) => void;
  existingImages?: ProductImage[];
  maxImages?: number;
  onCreateDraft?: () => Promise<string | null>;
}

export function ImageUploader({ 
  productId, 
  onImagesUploaded, 
  existingImages = [],
  maxImages = 10,
  onCreateDraft
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    
    // If no productId, try to create a draft product first
    let currentProductId = productId;
    
    if (!currentProductId && onCreateDraft) {
      console.log('No product ID, attempting to create draft product...');
      currentProductId = await onCreateDraft();
      
      if (!currentProductId) {
        setError('Failed to create draft product for image upload');
        return;
      }
    }
    
    if (!currentProductId) {
      setError('No product ID available for image upload. Please save the product first.');
      return;
    }
    
    console.log('Uploading images for product:', currentProductId);
    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/products/${currentProductId}/images`, {
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
          setError(null);
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
      setError(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        const updatedImages = existingImages.filter(img => img.id !== imageId);
        onImagesUploaded?.(updatedImages);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(error.message || 'Failed to delete image');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canUploadMore = existingImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Upload Product Images
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-400">
                Maximum {maxImages} images, up to 5MB each
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={uploading}
              className="mt-4"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Select Images'}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {existingImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Images ({existingImages.length}/{maxImages})
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Image Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteImage(image.id)}
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Primary
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Limit Message */}
      {!canUploadMore && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Maximum number of images reached ({maxImages})
          </p>
        </div>
      )}

      {/* Help Text */}
      {!productId && !onCreateDraft && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          <p>⚠️ <strong>Note:</strong> Please save the product first to enable image uploads.</p>
        </div>
      )}
    </div>
  );
}