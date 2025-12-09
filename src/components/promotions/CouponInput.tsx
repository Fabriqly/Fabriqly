'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { Check, X, Loader2 } from 'lucide-react';

export function CouponInput() {
  const { state, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setError(null);

    const result = await applyCoupon(code.toUpperCase().trim());

    if (result.success) {
      setCode('');
    } else {
      setError(result.error || 'Failed to apply coupon');
    }

    setIsApplying(false);
  };

  const handleRemove = async () => {
    await removeCoupon();
    setCode('');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isApplying) {
      handleApply();
    }
  };

  if (state.couponCode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Coupon Applied: {state.couponCode}
              </p>
              <p className="text-xs text-green-700">
                You saved {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(state.discountAmount)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Have a coupon code?
      </label>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          className="flex-1 uppercase"
          disabled={isApplying}
        />
        <Button
          onClick={handleApply}
          disabled={isApplying || !code.trim()}
          variant="outline"
        >
          {isApplying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}



