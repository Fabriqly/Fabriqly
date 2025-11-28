'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  showTotal?: boolean;
}

function RatingDisplay({ 
  rating, 
  totalReviews, 
  size = 'md',
  showNumber = true,
  showTotal = false
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${sizeClasses[size]} text-yellow-400 fill-current`}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${sizeClasses[size]} text-gray-300`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${sizeClasses[size]} text-yellow-400 fill-current`} />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${sizeClasses[size]} text-gray-300`}
          />
        ))}
      </div>
      {showNumber && (
        <span className={`text-gray-700 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {showTotal && totalReviews !== undefined && (
        <span className={`text-gray-500 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'} ml-1`}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}

export { RatingDisplay };
export default RatingDisplay;