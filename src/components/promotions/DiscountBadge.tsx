'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { DiscountType } from '@/types/promotion';

interface DiscountBadgeProps {
  type: DiscountType;
  value: number;
  className?: string;
}

export function DiscountBadge({ type, value, className = '' }: DiscountBadgeProps) {
  const displayValue = type === 'percentage' 
    ? `${value}% OFF`
    : `$${value} OFF`;

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded ${className}`}>
      <Tag className="w-3 h-3" />
      <span>{displayValue}</span>
    </div>
  );
}



