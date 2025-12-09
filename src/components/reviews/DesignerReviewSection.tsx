'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/types/firebase';
import { DesignerProfile } from '@/types/enhanced-products';
import { RatingDisplay } from './RatingDisplay';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare } from 'lucide-react';

interface DesignerReviewSectionProps {
  designer: DesignerProfile;
}

export function DesignerReviewSection({ designer }: DesignerReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(designer.portfolioStats?.averageRating || 0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
    loadRatingStats();
  }, [designer.id, user?.id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?designerId=${designer.id}&reviewType=designer`);
      const data = await response.json();
      
      if (data.success) {
        const fetchedReviews = data.data || [];
        setReviews(fetchedReviews);
        // Check if user has already reviewed
        if (user?.id) {
          const userReview = fetchedReviews.find((r: Review) => r.customerId === user.id);
          setHasUserReviewed(!!userReview);
        }
      } else {
        console.error('Failed to load reviews:', data.error);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatingStats = async () => {
    try {
      const response = await fetch(`/api/reviews/average?type=designer&targetId=${designer.id}`);
      const data = await response.json();
      
      if (data.success) {
        setAverageRating(data.data.average || 0);
        setTotalReviews(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
    }
  };

  const handleReviewSuccess = async (newReview?: Review) => {
    setShowReviewForm(false);
    setLoading(true);
    
    // If we have the new review, add it to the state immediately
    if (newReview) {
      setReviews(prev => [newReview, ...prev]);
      setHasUserReviewed(true);
    }
    
    // Small delay to ensure the review is saved in the database, then refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadReviews();
    await loadRatingStats();
  };

  const handleDelete = async () => {
    setLoading(true);
    await loadReviews();
    await loadRatingStats();
  };

  const isDesigner = user?.id === designer.userId;

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
            reviewType="designer"
            targetId={designer.id}
            targetName={designer.businessName}
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

