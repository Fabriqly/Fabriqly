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
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  useEffect(() => {
    if (user && (isDesigner || isBusinessOwner)) {
      loadFinanceData();
    }
  }, [user, isDesigner, isBusinessOwner, timeRange]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);

      // Load finance summary
      const summaryResponse = await fetch(`/api/finance?timeRange=${timeRange}`);
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

      // Load analytics
      const analyticsResponse = await fetch(`/api/finance/analytics?timeRange=${timeRange}`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }
      }

      // Load payment history
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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading finance data...</p>
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
        <div className="flex-1">
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
                {analytics && (
                  <RevenueChart
                    analytics={analytics}
                    role={role}
                    currentTimeRange={timeRange}
                    onTimeRangeChange={(range) => setTimeRange(range as TimeRange)}
                  />
                )}
              </div>

              {/* Revenue Breakdown */}
              <div>
                {analytics && (
                  <RevenueBreakdown analytics={analytics} role={role} />
                )}
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

