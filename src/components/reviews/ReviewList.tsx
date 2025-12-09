'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/types/firebase';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
  onDelete?: () => void;
  onReplySuccess?: () => void;
  canReply?: boolean;
  itemsPerPage?: number;
}

export function ReviewList({
  reviews,
  onDelete,
  onReplySuccess,
  canReply = false,
  itemsPerPage = 10
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  useEffect(() => {
    // Reset to page 1 when reviews change
    setCurrentPage(1);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {paginatedReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onDelete={onDelete}
            onReplySuccess={onReplySuccess}
            canReply={canReply}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, reviews.length)} of {reviews.length} reviews
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

