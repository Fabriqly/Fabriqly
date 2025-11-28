'use client';

import React from 'react';
import { AppliedDiscount } from '@/types/promotion';
import { X } from 'lucide-react';

interface DiscountSummaryProps {
  discounts: AppliedDiscount[];
  totalDiscount: number;
  onRemove?: (discountId: string) => void;
}

export function DiscountSummary({ 
  discounts, 
  totalDiscount,
  onRemove 
}: DiscountSummaryProps) {
  if (discounts.length === 0 || totalDiscount === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">Applied Discounts</div>
      <div className="space-y-2">
        {discounts.map((discount, index) => (
          <div
            key={discount.discountId || index}
            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                {discount.couponCode || 'Discount'}
              </p>
              <p className="text-xs text-green-700">
                {discount.discountType === 'percentage'
                  ? `${discount.discountValue}% off`
                  : `$${discount.discountValue} off`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-green-900">
                -{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(discount.discountAmount)}
              </span>
              {onRemove && (
                <button
                  onClick={() => onRemove(discount.discountId)}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm font-medium text-gray-700">Total Discount</span>
        <span className="text-sm font-semibold text-green-600">
          -{new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(totalDiscount)}
        </span>
      </div>
    </div>
  );
}



