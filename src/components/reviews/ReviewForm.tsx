'use client';

import { useState, useEffect } from 'react';
import { RatingInput } from './RatingInput';
import { X, Upload, Image as ImageIcon, Package } from 'lucide-react';
import Link from 'next/link';

interface PurchasedDesign {
  id: string;
  designName: string;
  thumbnailUrl?: string | null;
  designType?: string | null;
  orderId: string;
  orderDate: any;
}

interface ReviewFormProps {
  reviewType: 'product' | 'shop' | 'designer' | 'design' | 'customization';
  targetId: string;
  targetName: string;
  onSuccess: (review?: any) => void;
  onCancel: () => void;
}

export function ReviewForm({
  reviewType,
  targetId,
  targetName,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [purchasedDesigns, setPurchasedDesigns] = useState<PurchasedDesign[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Upload failed');
        }

        const result = await response.json();
        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedUrls]);
    } catch (error: any) {
      alert(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Load purchased designs when reviewing a designer
  useEffect(() => {
    if (reviewType === 'designer') {
      loadPurchasedDesigns();
    }
  }, [reviewType, targetId]);

  const loadPurchasedDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const response = await fetch(`/api/designers/${targetId}/purchased-designs`);
      const data = await response.json();
      
      if (data.success) {
        setPurchasedDesigns(data.data || []);
      }
    } catch (error) {
      console.error('Error loading purchased designs:', error);
    } finally {
      setLoadingDesigns(false);
    }
  };

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      const requestBody: any = {
        rating,
        comment,
        reviewType,
        images: images.length > 0 ? images : undefined
      };

      // Add the appropriate ID field based on review type
      if (reviewType === 'product') requestBody.productId = targetId;
      else if (reviewType === 'shop') requestBody.shopId = targetId;
      else if (reviewType === 'designer') {
        requestBody.designerId = targetId;
        // Include selected design IDs if any
        if (selectedDesigns.length > 0) {
          requestBody.designIds = selectedDesigns; // Support multiple designs
          // Also set designId for backward compatibility (use first selected)
          requestBody.designId = selectedDesigns[0];
        }
      } else if (reviewType === 'design') requestBody.designId = targetId;
      else if (reviewType === 'customization') requestBody.customizationRequestId = targetId;

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        alert('Review submitted successfully!');
        onSuccess(data.data); // Pass the created review to the callback
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewTypeLabel = () => {
    switch (reviewType) {
      case 'product': return 'Product';
      case 'shop': return 'Printing Shop';
      case 'designer': return 'Designer';
      case 'design': return 'Design';
      case 'customization': return 'Service';
      default: return '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Review {getReviewTypeLabel()}: {targetName}
        </h3>
        <p className="text-sm text-gray-600">
          Share your experience to help others make informed decisions
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      {/* Design Selection for Designer Reviews */}
      {reviewType === 'designer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Design(s) (Optional)
            <span className="text-xs text-gray-500 ml-2">
              Choose which design(s) this review is about
            </span>
          </label>
          {loadingDesigns ? (
            <div className="text-sm text-gray-500">Loading purchased designs...</div>
          ) : purchasedDesigns.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {purchasedDesigns.map((design) => (
                <label
                  key={design.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedDesigns.includes(design.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDesigns.includes(design.id)}
                    onChange={() => toggleDesignSelection(design.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  {design.thumbnailUrl ? (
                    <img
                      src={design.thumbnailUrl}
                      alt={design.designName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {design.designName}
                    </p>
                    {design.designType && (
                      <p className="text-xs text-gray-500 capitalize">
                        {design.designType}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-lg bg-gray-50">
              No purchased designs found. You can still write a review about the designer.
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          placeholder={`Tell us about your experience with this ${reviewType}...`}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {comment.length} characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="hidden"
              />
            </label>
            {uploadingImages && (
              <span className="text-sm text-gray-500">Uploading...</span>
            )}
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Review ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          You can upload up to 5 images. Maximum 5MB per image.
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={submitting || rating === 0 || !comment.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


















