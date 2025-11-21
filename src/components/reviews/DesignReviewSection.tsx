'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/types/firebase';
import { DesignWithDetails } from '@/types/enhanced-products';
import { RatingDisplay } from './RatingDisplay';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare } from 'lucide-react';

interface DesignReviewSectionProps {
  design: DesignWithDetails;
}

export function DesignReviewSection({ design }: DesignReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
    loadRatingStats();
  }, [design.id, user?.id]);

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?designId=${design.id}&reviewType=design`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data || []);
        // Check if user has already reviewed
        if (user?.id) {
          const userReview = data.data?.find((r: Review) => r.customerId === user.id);
          setHasUserReviewed(!!userReview);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatingStats = async () => {
    try {
      const response = await fetch(`/api/reviews/average?type=design&targetId=${design.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAverageRating(data.data.average || 0);
        setTotalReviews(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReviews();
    loadRatingStats();
  };

  const handleDelete = () => {
    loadReviews();
    loadRatingStats();
  };

  const isDesigner = user?.id === design.designerId;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-4">
            <RatingDisplay 
              rating={averageRating} 
              totalReviews={totalReviews}
              size="lg"
              showNumber={true}
              showTotal={true}
            />
          </div>
        </div>
        {user && !hasUserReviewed && !showReviewForm && !isDesigner && (
          <Button onClick={() => setShowReviewForm(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}
      </div>

      {showReviewForm && (
        <div className="border-t border-gray-200 pt-6">
          <ReviewForm
            reviewType="design"
            targetId={design.id}
            targetName={design.designName}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      <div className="border-t border-gray-200 pt-6">
        <ReviewList
          reviews={reviews}
          onDelete={handleDelete}
          onReplySuccess={loadReviews}
          canReply={isDesigner}
        />
      </div>
    </div>
  );
}

