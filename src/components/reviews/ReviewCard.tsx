'use client';

import React, { useState } from 'react';
import { Review } from '@/types/firebase';
import { RatingDisplay } from './RatingDisplay';
import { ReviewReplyForm } from './ReviewReplyForm';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  onReplySuccess?: () => void;
  canReply?: boolean;
  showReplyForm?: boolean;
}

export function ReviewCard({
  review,
  onDelete,
  onReplySuccess,
  canReply = false,
  showReplyForm = false
}: ReviewCardProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(showReplyForm);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = user && (
    user.id === review.customerId || 
    user.role === 'admin' ||
    (review.reviewType === 'shop' && user.role === 'business_owner') ||
    (review.reviewType === 'designer' && user.role === 'designer')
  );

  const canReplyToReview = canReply && !review.reply && user && (
    (review.reviewType === 'shop' && user.role === 'business_owner') ||
    (review.reviewType === 'designer' && user.role === 'designer') ||
    (review.reviewType === 'design' && user.role === 'designer') ||
    user.role === 'admin'
  );

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        onDelete?.();
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {review.customerName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {review.customerName || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
          <div className="mb-2">
            <RatingDisplay rating={review.rating} size="sm" showNumber={false} />
          </div>
        </div>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {review.images.map((imageUrl, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img
                src={imageUrl}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Reply Section */}
      {review.reply && (
        <div className="ml-6 pl-4 border-l-2 border-blue-200 bg-blue-50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-blue-900">
              {review.reply.authorName}
            </span>
            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {review.reply.authorRole === 'shop_owner' ? 'Shop Owner' :
               review.reply.authorRole === 'designer' ? 'Designer' : 'Admin'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(review.reply.createdAt)}
            </span>
          </div>
          <p className="text-gray-700 text-sm">{review.reply.comment}</p>
        </div>
      )}

      {/* Reply Button/Form */}
      {canReplyToReview && !review.reply && (
        <div>
          {!isReplying ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReplying(true)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Reply
            </Button>
          ) : (
            <ReviewReplyForm
              reviewId={review.id}
              onSuccess={() => {
                setIsReplying(false);
                onReplySuccess?.();
              }}
              onCancel={() => setIsReplying(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

