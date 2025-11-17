'use client';

import { useState } from 'react';

interface ReviewFormProps {
  reviewType: 'product' | 'shop' | 'designer' | 'customization';
  targetId: string;
  targetName: string;
  onSuccess: () => void;
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
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        reviewType
      };

      // Add the appropriate ID field based on review type
      if (reviewType === 'product') requestBody.productId = targetId;
      else if (reviewType === 'shop') requestBody.shopId = targetId;
      else if (reviewType === 'designer') requestBody.designerId = targetId;
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
        onSuccess();
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
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl focus:outline-none transition-colors"
            >
              <span
                className={
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
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












