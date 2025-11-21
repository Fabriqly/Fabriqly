'use client';

import React from 'react';
import { FinanceSummary } from '@/services/FinanceService';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface FinanceOverviewProps {
  summary: FinanceSummary;
  role: 'designer' | 'business_owner';
  loading?: boolean;
}

export function FinanceOverview({ summary, role, loading = false }: FinanceOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const isDesigner = role === 'designer';
  const title = isDesigner ? 'Total Earnings' : 'Total Revenue';

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Earnings/Revenue */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(isDesigner ? summary.totalEarnings : summary.totalRevenue)}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(isDesigner ? summary.thisMonthEarnings : summary.thisMonthRevenue)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Pending Amount */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(summary.pendingAmount)}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Paid Amount */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(summary.paidAmount)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

