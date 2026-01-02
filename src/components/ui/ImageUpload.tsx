'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  uploadType?: 'category' | 'product' | 'profile' | 'design'; // Type of upload
  entityId?: string; // ID of the entity (category, product, etc.)
}

export function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Upload an image",
  accept = "image/*",
  maxSize = 5,
  className = "",
  uploadType = 'category',
  entityId
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBucketForType = (type: string) => {
    switch (type) {
      case 'category': return StorageBuckets.CATEGORIES;
      case 'product': return StorageBuckets.PRODUCTS;
      case 'profile': return StorageBuckets.PROFILES;
      case 'design': return StorageBuckets.DESIGNS;
      default: return StorageBuckets.CATEGORIES;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (uploadType === 'category' && entityId) {
        // Upload category image via API (more secure)
        await uploadCategoryImage(file, entityId);
      } else if (uploadType === 'category' && !entityId) {
        // For new categories without ID, create a temporary upload
        const tempId = 'temp-' + Date.now();
        await uploadCategoryImage(file, tempId);
      } else if (uploadType === 'profile') {
        // Upload profile/featured customer image via API (bypasses RLS)
        await uploadProfileImage(file, entityId);
      } else {
        // Upload directly to Supabase Storage for other types
        const bucket = getBucketForType(uploadType);
        const folder = entityId || 'temp';
        
        const uploadResult = await SupabaseStorageService.uploadFile(file, {
          bucket,
          folder,
          upsert: false
        });
        
        onChange(uploadResult.url);
        setImageError(false); // Reset error state on successful upload
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCategoryImage = async (file: File, categoryId: string) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/categories/${categoryId}/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    
    // Handle ResponseBuilder structure
    const imageData = data.data || data;
    onChange(imageData.imageUrl);
  };

  const uploadProfileImage = async (file: File, designerId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (designerId) {
      formData.append('designerId', designerId);
    }

    const response = await fetch('/api/upload/featured-customer', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || errorData.error || 'Failed to upload image';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Handle ResponseBuilder structure
    const imageData = data.data || data;
    onChange(imageData.url);
  };

  const handleRemove = async () => {
    if (value && uploadType === 'category' && entityId) {
      // Try to delete from Supabase Storage if we have storage info
      try {
        // Extract storage path from URL or use a default pattern
        const urlParts = value.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const storagePath = `${entityId}/${fileName}`;
        
        await SupabaseStorageService.deleteFile(StorageBuckets.CATEGORIES, storagePath);
      } catch (error) {
        console.warn('Could not delete image from storage:', error);
      }
    }
    
    onChange('');
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md bg-gray-50">
            <div className="flex-shrink-0">
              {imageError ? (
                <div className="w-12 h-12 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-red-400" />
                </div>
              ) : (
                <img
                  src={value}
                  alt="Uploaded"
                  className="w-12 h-12 object-cover rounded-md"
                  onError={(e) => {
                    // Mark image as failed so we can show a nicer UI instead of a broken image
                    setImageError(true);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => setImageError(false)}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {imageError ? (
                <>
                  <p className="text-sm font-medium text-red-600 truncate">
                    Image failed to load
                  </p>
                  <p className="text-xs text-red-500">
                    Please re-upload the image
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Image uploaded
                  </p>
                  <p className="text-xs text-gray-500">
                    Click to change or remove
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-black bg-opacity-10 rounded-md transition-opacity flex items-center justify-center"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center space-y-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {isUploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-xs text-gray-500">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF up to {maxSize}MB
              </p>
            </div>
          </div>
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
