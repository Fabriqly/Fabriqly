'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FinanceOverview } from '@/components/finance/FinanceOverview';
import { RevenueChart } from '@/components/finance/RevenueChart';
import { PaymentTable } from '@/components/finance/PaymentTable';
import { RevenueBreakdown } from '@/components/finance/RevenueBreakdown';
import { FinanceSummary, RevenueAnalytics, PaymentTransaction, TimeRange } from '@/services/FinanceService';
import { Loader } from 'lucide-react';

function FinanceContent() {
  const { user, isDesigner, isBusinessOwner, isLoading } = useAuth();
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Load initial data (summary and payments) - only on mount or user change
  useEffect(() => {
    if (user && (isDesigner || isBusinessOwner)) {
      loadInitialData();
    }
  }, [user, isDesigner, isBusinessOwner]);

  // Load analytics separately when time range changes
  useEffect(() => {
    if (user && (isDesigner || isBusinessOwner)) {
      loadAnalytics();
    }
  }, [timeRange, user, isDesigner, isBusinessOwner]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load finance summary (using default timeRange for initial load)
      const summaryResponse = await fetch(`/api/finance?timeRange=30d`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('[FinancePage] Received finance summary:', summaryData);
        if (summaryData.success) {
          console.log('[FinancePage] Setting finance summary:', summaryData.data);
          setFinanceSummary(summaryData.data);
        } else {
          console.error('[FinancePage] Finance summary not successful:', summaryData);
        }
      } else {
        console.error('[FinancePage] Failed to fetch finance summary:', summaryResponse.status);
      }

      // Load payment history (not dependent on time range)
      const paymentsResponse = await fetch('/api/finance/payments');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.success) {
          setPayments(paymentsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      // Load analytics with current time range
      const analyticsResponse = await fetch(`/api/finance/analytics?timeRange=${timeRange}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              {/* Page Header Skeleton */}
              <div className="mb-8">
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>

              {/* Finance Overview Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts and Breakdown Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart Skeleton */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 bg-gray-200 rounded w-40"></div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-8 bg-gray-200 rounded w-16"></div>
                        ))}
                      </div>
                    </div>
                    <div className="h-64 bg-gray-100 rounded flex items-end space-x-1 p-4">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gray-200 rounded-t"
                          style={{ height: `${Math.random() * 60 + 20}%` }}
                        ></div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>

                {/* Revenue Breakdown Skeleton */}
                <div>
                  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
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
              </div>

              {/* Payment Table Skeleton */}
              <div className="bg-white rounded-lg shadow animate-pulse">
                <div className="p-6 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isDesigner && !isBusinessOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Finance data is only available for designers and business owners.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const role = isDesigner ? 'designer' : 'business_owner';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1">
        <DashboardSidebar user={user} />
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {isDesigner 
                  ? 'Track your earnings and design fees' 
                  : 'Monitor your revenue and payment status'}
              </p>
            </div>

            {/* Finance Overview Cards */}
            {financeSummary ? (
              <div className="mb-8">
                <FinanceOverview summary={financeSummary} role={role} />
              </div>
            ) : (
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">No finance data available. Please check the console for details.</p>
              </div>
            )}

            {/* Charts and Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="lg:col-span-2">
                <RevenueChart
                  analytics={analytics}
                  role={role}
                  loading={analyticsLoading}
                  currentTimeRange={timeRange}
                  onTimeRangeChange={(range) => setTimeRange(range as TimeRange)}
                />
              </div>

              {/* Revenue Breakdown */}
              <div>
                <RevenueBreakdown analytics={analytics} role={role} loading={analyticsLoading} />
              </div>
            </div>

            {/* Payment History Table */}
            <div className="mb-8">
              <PaymentTable payments={payments} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <ProtectedRoute>
      <FinanceContent />
    </ProtectedRoute>
  );
}

