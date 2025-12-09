'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Loader2, Tag, Percent, DollarSign, Truck, Package, ShoppingCart, Check } from 'lucide-react';
import { Discount, CouponCode } from '@/types/promotion';

interface AvailableDiscount {
  discount: Discount;
  coupons: Array<{
    id: string;
    code: string;
    name?: string;
    description?: string;
    usageLimit?: number;
    usedCount: number;
    perUserLimit?: number;
    startDate?: Date | any;
    endDate?: Date | any;
    status: string;
  }>;
  previewDiscountAmount: number;
  requiresCoupon: boolean;
}

interface CouponSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (couponCode: string | null, discountId: string | null) => void;
  orderAmount: number;
  shippingCost: number;
  productIds?: string[];
  categoryIds?: string[];
  currentCouponCode?: string | null;
}

export function CouponSelectionModal({
  isOpen,
  onClose,
  onSelect,
  orderAmount,
  shippingCost,
  productIds = [],
  categoryIds = [],
  currentCouponCode
}: CouponSelectionModalProps) {
  const [availableDiscounts, setAvailableDiscounts] = useState<AvailableDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [enteredCouponCode, setEnteredCouponCode] = useState('');
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(currentCouponCode || null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableDiscounts();
    }
  }, [isOpen, orderAmount, productIds, categoryIds]);

  const fetchAvailableDiscounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        orderAmount: orderAmount.toString(),
      });
      
      productIds.forEach(id => params.append('productIds[]', id));
      categoryIds.forEach(id => params.append('categoryIds[]', id));

      const response = await fetch(`/api/discounts/available?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Available discounts:', data.data);
        setAvailableDiscounts(data.data || []);
      } else {
        const errorMsg = data.error || data.message || 'Failed to load available discounts';
        console.error('Error response:', data);
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } catch (error: any) {
      console.error('Error fetching available discounts:', error);
      const errorMsg = error?.message || 'Failed to load available discounts';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDiscount = (discountId: string, couponCode?: string) => {
    setSelectedDiscountId(discountId);
    if (couponCode) {
      setSelectedCouponCode(couponCode);
      setEnteredCouponCode(couponCode);
    } else {
      setSelectedCouponCode(null);
      setEnteredCouponCode('');
    }
  };

  const handleApply = () => {
    // If a coupon code is entered directly, apply it
    if (enteredCouponCode.trim() && !selectedDiscountId) {
      onSelect(enteredCouponCode.toUpperCase().trim(), null);
      onClose();
      return;
    }

    // Otherwise, apply selected discount
    if (selectedDiscountId) {
      const discount = availableDiscounts.find(ad => ad.discount.id === selectedDiscountId);
      if (discount) {
        if (discount.requiresCoupon) {
          // If discount requires coupon, use entered code or first available coupon
          const couponToUse = enteredCouponCode.trim() || (discount.coupons.length > 0 ? discount.coupons[0].code : null);
          if (!couponToUse) {
            setError('Please enter a coupon code for this discount');
            return;
          }
          console.log('[CouponSelectionModal] Applying discount with coupon:', { discountId: selectedDiscountId, couponCode: couponToUse });
          onSelect(couponToUse.toUpperCase().trim(), selectedDiscountId);
        } else {
          // For discounts without coupons, we can't apply them directly
          // They need to be applied through the order creation process
          setError('This discount cannot be applied directly. Please use a coupon code.');
          return;
        }
        onClose();
      }
    } else {
      setError('Please select a discount or enter a coupon code');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'shipping':
        return <Truck className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'category':
        return <Tag className="w-4 h-4" />;
      case 'order':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'shipping':
        return 'Shipping';
      case 'product':
        return 'Product';
      case 'category':
        return 'Category';
      case 'order':
        return 'Order';
      default:
        return scope;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Select Discount or Coupon</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search/Input Section */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Coupon Code
            </label>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={enteredCouponCode}
                onChange={(e) => {
                  setEnteredCouponCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                className="flex-1 uppercase"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && enteredCouponCode.trim()) {
                    handleApply();
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (enteredCouponCode.trim()) {
                    onSelect(enteredCouponCode.toUpperCase().trim(), null);
                    onClose();
                  } else {
                    setError('Please enter a coupon code');
                  }
                }}
                disabled={!enteredCouponCode.trim()}
                variant="outline"
              >
                Apply
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600">{typeof error === 'string' ? error : (error as any)?.message || 'An error occurred'}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{typeof error === 'string' ? error : error?.message || 'An error occurred'}</p>
            </div>
          ) : availableDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No available discounts at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDiscounts.map(({ discount, coupons, previewDiscountAmount, requiresCoupon }) => (
                <div
                  key={discount.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDiscountId === discount.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    // Auto-select first coupon if available
                    const firstCoupon = coupons.length > 0 ? coupons[0].code : undefined;
                    handleSelectDiscount(discount.id, firstCoupon);
                    // If discount requires coupon and we have one, auto-populate it
                    if (requiresCoupon && firstCoupon) {
                      setEnteredCouponCode(firstCoupon);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {selectedDiscountId === discount.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">{discount.name}</h3>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          {getScopeIcon(discount.scope)}
                          <span>{getScopeLabel(discount.scope)}</span>
                        </div>
                      </div>
                      
                      {discount.description && (
                        <p className="text-sm text-gray-600 mb-2">{discount.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          {discount.type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-gray-400" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">
                            {discount.type === 'percentage'
                              ? `${discount.value}%`
                              : formatPrice(discount.value)}
                          </span>
                        </div>
                        <span className="text-gray-500">off</span>
                        {discount.scope === 'shipping' && (
                          <span className="text-gray-500">shipping</span>
                        )}
                        {discount.scope === 'product' && (
                          <span className="text-gray-500">products</span>
                        )}
                        {discount.scope === 'order' && (
                          <span className="text-gray-500">order</span>
                        )}
                      </div>

                      {requiresCoupon && (
                        <div className="mt-3">
                          {coupons.length > 0 && (
                            <div className="space-y-2">
                              {coupons.map((coupon) => (
                                <div
                                  key={coupon.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectDiscount(discount.id, coupon.code);
                                  }}
                                >
                                  <div>
                                    <span className="font-mono text-sm font-medium">{coupon.code}</span>
                                    {coupon.name && (
                                      <p className="text-xs text-gray-500">{coupon.name}</p>
                                    )}
                                  </div>
                                  {selectedCouponCode === coupon.code && (
                                    <Check className="w-4 h-4 text-blue-600" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {selectedDiscountId === discount.id && (
                            <div className="mt-2">
                              <Input
                                type="text"
                                placeholder="Or enter coupon code"
                                value={enteredCouponCode}
                                onChange={(e) => {
                                  setEnteredCouponCode(e.target.value.toUpperCase());
                                  setError(null);
                                }}
                                className="uppercase"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-green-600 font-medium">
                        Save up to {formatPrice(previewDiscountAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedDiscountId || (availableDiscounts.find(ad => ad.discount.id === selectedDiscountId)?.requiresCoupon && !enteredCouponCode.trim())}
          >
            Apply Discount
          </Button>
        </div>
      </div>
    </div>
  );
}

