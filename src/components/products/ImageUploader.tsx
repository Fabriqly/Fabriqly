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
  disabled?: boolean;
}

export function ImageUploader({ 
  productId, 
  onImagesUploaded, 
  existingImages = [],
  maxImages = 10,
  onCreateDraft,
  disabled = false
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImages = useCallback(async (files: File[]) => {
    setError(null);
    
    // If no productId, try to create a draft product first
    let currentProductId = productId;
    
    if (!currentProductId && onCreateDraft) {
      console.log('No product ID, attempting to create draft product...');
      const draftId = await onCreateDraft();
      
      if (!draftId) {
        setError('Failed to create draft product for image upload');
        return;
      }
      
      currentProductId = draftId;
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
          // After successful upload, fetch all images to get the complete list
          const allImagesResponse = await fetch(`/api/products/${currentProductId}/images`);
          if (allImagesResponse.ok) {
            const allImagesData = await allImagesResponse.json();
            const allImages = allImagesData.images || allImagesData.data || [];
            onImagesUploaded?.(allImages);
          } else {
            // Fallback: merge new images with existing ones
            const newImages = data.images || [];
            const mergedImages = [...existingImages, ...newImages];
            onImagesUploaded?.(mergedImages);
          }
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
  }, [productId, existingImages, maxImages, onCreateDraft, onImagesUploaded]);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled) return;
    if (files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - existingImages.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length < fileArray.length) {
      alert(`Only ${remainingSlots} images can be uploaded. Maximum ${maxImages} images allowed.`);
    }

    await uploadImages(filesToUpload);
  }, [disabled, maxImages, existingImages.length, uploadImages]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    try {
      // Use the current productId (might be from draft creation)
      const currentProductId = productId || (existingImages.length > 0 ? existingImages[0].productId : null);
      
      if (!currentProductId) {
        throw new Error('Product ID not available');
      }

      const response = await fetch(`/api/products/${currentProductId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // After successful deletion, fetch all images to get the updated list
        const allImagesResponse = await fetch(`/api/products/${currentProductId}/images`);
        if (allImagesResponse.ok) {
          const allImagesData = await allImagesResponse.json();
          const allImages = allImagesData.images || allImagesData.data || [];
          onImagesUploaded?.(allImages);
        } else {
          // Fallback: remove from local state
          const updatedImages = existingImages.filter(img => img.id !== imageId);
          onImagesUploaded?.(updatedImages);
        }
      } else {
        const errorData = await response.json();
        // Handle different error response formats
        let errorMessage = 'Failed to delete image';
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.error.code) {
            errorMessage = errorData.error.code;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(error.message || 'Failed to delete image');
    }
  }, [productId, existingImages, onImagesUploaded]);

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
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const canUploadMore = existingImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              : dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={disabled ? undefined : handleDrag}
          onDragLeave={disabled ? undefined : handleDrag}
          onDragOver={disabled ? undefined : handleDrag}
          onDrop={disabled ? undefined : handleDrop}
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
              disabled={uploading || disabled}
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
                  {!imageErrors.has(image.id) ? (
                    <img
                      src={image.imageUrl}
                      alt={image.altText || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error('Image failed to load:', image.imageUrl);
                        console.error('Image data:', image);
                        setImageErrors(prev => new Set(prev).add(image.id));
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', image.imageUrl);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-center p-2">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 break-words">{image.altText}</p>
                        <p className="text-xs text-gray-400 break-all mt-1">{image.imageUrl}</p>
                        <button
                          onClick={() => {
                            setImageErrors(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(image.id);
                              return newSet;
                            });
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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