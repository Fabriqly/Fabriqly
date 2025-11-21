'use client';

import React, { useState } from 'react';
import { RevenueAnalytics } from '@/services/FinanceService';
import { Button } from '@/components/ui/Button';

interface RevenueChartProps {
  analytics: RevenueAnalytics;
  role: 'designer' | 'business_owner';
  loading?: boolean;
  onTimeRangeChange?: (range: string) => void;
  currentTimeRange?: string;
}

export function RevenueChart({ 
  analytics, 
  role, 
  loading = false,
  onTimeRangeChange,
  currentTimeRange = '30d'
}: RevenueChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ];

  if (loading || !analytics.timeSeries || analytics.timeSeries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {role === 'designer' ? 'Earnings Over Time' : 'Revenue Over Time'}
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...analytics.timeSeries.map(d => d.revenue), 1);
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {role === 'designer' ? 'Earnings Over Time' : 'Revenue Over Time'}
        </h3>
        {onTimeRangeChange && (
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={currentTimeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="h-64 flex items-end space-x-1 overflow-x-auto">
        {analytics.timeSeries.map((data, index) => {
          const barHeight = (data.revenue / maxValue) * chartHeight;
          const date = new Date(data.date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center min-w-[40px] group relative"
            >
              <div
                className={`w-full rounded-t transition-all hover:opacity-80 ${
                  isWeekend ? 'bg-blue-400' : 'bg-blue-500'
                }`}
                style={{ height: `${Math.max(barHeight, 2)}px` }}
                title={`${formatCurrency(data.revenue)} on ${date.toLocaleDateString()}`}
              >
                {data.revenue > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(data.revenue)}
                  </div>
                )}
              </div>
              {analytics.timeSeries.length <= 30 && (
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {analytics.growth && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Growth Rate</span>
            <span className={`text-sm font-medium ${
              analytics.growth.percentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics.growth.percentage >= 0 ? '+' : ''}{analytics.growth.percentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

