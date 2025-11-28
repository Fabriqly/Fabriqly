'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateCouponData } from '@/types/promotion';
import { X, Loader2 } from 'lucide-react';

interface CouponGeneratorProps {
  discountId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CouponGenerator({ discountId, onClose, onSuccess }: CouponGeneratorProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [perUserLimit, setPerUserLimit] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const generateCode = (): string => {
    // Generate a random code synchronously
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return 'PROMO-' + Array.from({ length: 8 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  };

  const handleGenerateCode = () => {
    setError(null);
    // Generate a random code
    const generated = generateCode();
    setGeneratedCode(generated);
    setCode(generated);
  };

  // Generate code on mount if auto-generate is enabled
  useEffect(() => {
    if (autoGenerate && !code) {
      handleGenerateCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // If auto-generate is enabled and code is empty, generate it now
    let finalCode = code.trim();
    if (autoGenerate && !finalCode) {
      finalCode = generateCode();
      setCode(finalCode);
      setGeneratedCode(finalCode);
    }

    if (!finalCode) {
      setError('Coupon code is required');
      setLoading(false);
      return;
    }

    try {
      const couponData: CreateCouponData = {
        code: finalCode.toUpperCase().trim(),
        discountId,
        name: name || undefined,
        description: description || undefined,
        usageLimit: usageLimit || undefined,
        perUserLimit: perUserLimit || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create coupon');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      setError('Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Generate Coupon Code</h2>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Coupon Code *
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setAutoGenerate(isChecked);
                    if (isChecked) {
                      // Generate code immediately when auto-generate is enabled
                      handleGenerateCode();
                    } else {
                      // Clear code when auto-generate is disabled
                      setCode('');
                      setGeneratedCode(null);
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Auto-generate</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter or generate code"
                required={!autoGenerate}
                disabled={autoGenerate}
                className="uppercase"
              />
              {!autoGenerate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              )}
            </div>
            {generatedCode && (
              <p className="mt-1 text-xs text-green-600">
                Generated code: {generatedCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Optional)
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coupon name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Coupon description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
              <Input
                type="number"
                value={usageLimit || ''}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                min={1}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per User Limit
              </label>
              <Input
                type="number"
                value={perUserLimit || ''}
                onChange={(e) => setPerUserLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                min={1}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

