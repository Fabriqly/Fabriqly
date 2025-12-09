'use client';

import React from 'react';
import { RevenueAnalytics } from '@/services/FinanceService';
import { Package, Palette } from 'lucide-react';

interface RevenueBreakdownProps {
  analytics: RevenueAnalytics;
  role: 'designer' | 'business_owner';
  loading?: boolean;
}

export function RevenueBreakdown({ analytics, role, loading = false }: RevenueBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading || !analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-200 rounded-full" style={{ width: `${Math.random() * 40 + 30}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const total = analytics.breakdown.customizations + analytics.breakdown.orders;
  const customizationPercentage = total > 0 ? (analytics.breakdown.customizations / total) * 100 : 0;
  const orderPercentage = total > 0 ? (analytics.breakdown.orders / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
      
      {role === 'business_owner' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Customizations</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(analytics.breakdown.customizations)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${customizationPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{customizationPercentage.toFixed(1)}%</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Orders</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(analytics.breakdown.orders)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${orderPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{orderPercentage.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {role === 'designer' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Design Fees</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(analytics.breakdown.customizations)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* Top Items */}
      {analytics.topItems && analytics.topItems.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Earning Items</h4>
          <div className="space-y-2">
            {analytics.topItems.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.count}x)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

