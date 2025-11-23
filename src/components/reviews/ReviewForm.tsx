'use client';

import { useState } from 'react';
import { RatingInput } from './RatingInput';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

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
      else if (reviewType === 'designer') requestBody.designerId = targetId;
      else if (reviewType === 'design') requestBody.designId = targetId;
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


















