'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Discount, CreateDiscountData, DiscountType, DiscountScope } from '@/types/promotion';
import { X } from 'lucide-react';

interface DiscountFormProps {
  discount?: Discount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DiscountForm({ discount, onClose, onSuccess }: DiscountFormProps) {
  const [formData, setFormData] = useState<CreateDiscountData>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    scope: 'order',
    targetIds: [],
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (discount) {
      // Helper function to convert various date formats to YYYY-MM-DD
      const formatDateForInput = (date: any): string => {
        if (!date) return new Date().toISOString().split('T')[0];
        
        // If it's already a Date object
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        
        // If it's a Firestore Timestamp (has toDate method)
        if (date && typeof date.toDate === 'function') {
          return date.toDate().toISOString().split('T')[0];
        }
        
        // If it's a string, try to parse it
        if (typeof date === 'string') {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
        
        // If it's an object with seconds (Firestore Timestamp format)
        if (date && typeof date.seconds === 'number') {
          return new Date(date.seconds * 1000).toISOString().split('T')[0];
        }
        
        // Fallback to current date
        return new Date().toISOString().split('T')[0];
      };

      setFormData({
        name: discount.name,
        description: discount.description || '',
        type: discount.type,
        value: discount.value,
        scope: discount.scope,
        targetIds: discount.targetIds || [],
        minOrderAmount: discount.minOrderAmount,
        maxDiscountAmount: discount.maxDiscountAmount,
        startDate: formatDateForInput(discount.startDate),
        endDate: formatDateForInput(discount.endDate),
        usageLimit: discount.usageLimit,
      });
    }
  }, [discount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate targetIds for product/category scopes
    if ((formData.scope === 'product' || formData.scope === 'category') && 
        (!formData.targetIds || formData.targetIds.length === 0)) {
      setError(`${formData.scope === 'product' ? 'Product' : 'Category'} IDs are required for ${formData.scope}-level discounts`);
      setLoading(false);
      return;
    }

    try {
      const url = discount ? `/api/discounts/${discount.id}` : '/api/discounts';
      const method = discount ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save discount');
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      setError('Failed to save discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {discount ? 'Edit Discount' : 'Create Discount'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as DiscountType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value *
              </label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                required
                min={0}
                step={formData.type === 'percentage' ? 1 : 0.01}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as DiscountScope })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="order">Order Level</option>
              <option value="product">Product Level</option>
              <option value="category">Category Level</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>

          {(formData.scope === 'product' || formData.scope === 'category') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.scope === 'product' ? 'Product IDs' : 'Category IDs'} *
                <span className="text-xs text-gray-500 ml-2">
                  (Comma-separated, e.g., "id1,id2,id3")
                </span>
              </label>
              <Input
                value={formData.targetIds?.join(',') || ''}
                onChange={(e) => {
                  const ids = e.target.value
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id.length > 0);
                  setFormData({ ...formData, targetIds: ids });
                }}
                placeholder={formData.scope === 'product' 
                  ? 'Enter product IDs separated by commas' 
                  : 'Enter category IDs separated by commas'}
                required={formData.scope === 'product' || formData.scope === 'category'}
              />
              {formData.targetIds && formData.targetIds.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.targetIds.length} {formData.scope === 'product' ? 'product' : 'category'}(ies) selected
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount
              </label>
              <Input
                type="number"
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                min={0}
                step={0.01}
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount Amount
                </label>
                <Input
                  type="number"
                  value={formData.maxDiscountAmount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  min={0}
                  step={0.01}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Limit
            </label>
            <Input
              type="number"
              value={formData.usageLimit || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                usageLimit: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              min={1}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : discount ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

