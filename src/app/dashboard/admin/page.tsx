'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { 
  Users, 
  Package, 
  FolderOpen, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
}

interface PercentageChange {
  value: number | null;
  type: 'positive' | 'negative' | 'neutral' | 'unavailable';
  label?: string;
}

interface DashboardData {
  current: DashboardStats;
  changes: {
    totalUsers: PercentageChange;
    totalProducts: PercentageChange;
    totalCategories: PercentageChange;
    totalOrders: PercentageChange;
    totalRevenue: PercentageChange;
    activeProducts: PercentageChange;
    pendingOrders: PercentageChange;
  };
  period: string;
  comparisonDate: string;
  actualComparisonDate?: string;
  hasHistorical?: boolean;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    loadDashboardStats();
  }, [period]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First refresh the summary to ensure we have the latest data
      const refreshResponse = await fetch('/api/admin/refresh-summary', {
        method: 'POST'
      });
      
      if (!refreshResponse.ok) {
        console.warn('Failed to refresh dashboard summary, proceeding with cached data');
      }
      
      // Now fetch the dashboard stats
      const response = await fetch(`/api/dashboard-stats?period=${period}`);
      
      if (!response.ok) {
        // If API fails, try to parse error or show generic message
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Failed to load dashboard data: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      // Map API response to frontend expected format
      const mappedData = {
        current: data.current,
        changes: data.percentageChanges || {},
        period: data.period,
        comparisonDate: data.comparisonDate,
        historical: data.historical
      };
      
      setDashboardData(mappedData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      
      // Set fallback data so dashboard still shows something
      setDashboardData({
        current: {
          totalUsers: 2,
          totalProducts: 0,
          totalCategories: 0,
          totalOrders: 0,
          totalRevenue: 0,
          activeProducts: 0,
          pendingOrders: 0
        },
        changes: {
          totalUsers: { value: 0, type: 'neutral' },
          totalProducts: { value: 0, type: 'neutral' },
          totalCategories: { value: 0, type: 'neutral' },
          totalOrders: { value: 0, type: 'neutral' },
          totalRevenue: { value: 0, type: 'neutral' },
          activeProducts: { value: 0, type: 'neutral' },
          pendingOrders: { value: 0, type: 'neutral' }
        },
        period: period,
        comparisonDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    if (!dashboardData || !dashboardData.current) return [];

    const { current, changes = {} } = dashboardData;

    const formatChange = (change: PercentageChange | undefined) => {
      if (!change) return '0%';
      if (change.type === 'unavailable') {
        return change.label || 'No data';
      }
      if (change.value === 0 || change.value === null) return '0%';
      const sign = change.type === 'positive' ? '+' : change.type === 'negative' ? '-' : '';
      return `${sign}${change.value}%`;
    };

    const safeChange = (property: keyof typeof changes): PercentageChange => 
      changes[property] || { value: 0, type: 'neutral' };

    return [
      {
        name: 'Total Users',
        value: current.totalUsers,
        icon: Users,
        color: 'bg-blue-500',
        change: formatChange(safeChange('totalUsers')),
        changeType: safeChange('totalUsers').type
      },
      {
        name: 'Total Products',
        value: current.totalProducts,
        icon: Package,
        color: 'bg-green-500',
        change: formatChange(safeChange('totalProducts')),
        changeType: safeChange('totalProducts').type
      },
      {
        name: 'Categories',
        value: current.totalCategories,
        icon: FolderOpen,
        color: 'bg-purple-500',
        change: formatChange(safeChange('totalCategories')),
        changeType: safeChange('totalCategories').type
      },
      {
        name: 'Total Orders',
        value: current.totalOrders,
        icon: ShoppingCart,
        color: 'bg-orange-500',
        change: formatChange(safeChange('totalOrders')),
        changeType: safeChange('totalOrders').type
      },
      {
        name: 'Revenue',
        value: `$${current.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-emerald-500',
        change: formatChange(safeChange('totalRevenue')),
        changeType: safeChange('totalRevenue').type
      },
      {
        name: 'Active Products',
        value: current.activeProducts,
        icon: CheckCircle,
        color: 'bg-green-500',
        change: `${Math.round((current.activeProducts / Math.max(current.totalProducts, 1)) * 100)}%`,
        changeType: 'positive' as const
      }
    ];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome to the Fabriqly admin panel. Here's an overview of your platform.
            </p>
            {dashboardData && (
              <p className="mt-1 text-xs text-gray-400">
                Changes compared to {dashboardData.comparisonDate} ({dashboardData.period})
                {dashboardData.hasHistorical === false && (
                  <span className="text-amber-600 ml-2">⚠️ No historical data available</span>
                )}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadDashboardStats}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Dashboard Data Unavailable</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <p className="mt-1 text-xs text-red-600">
                  Showing fallback data. Check your connection and try refreshing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {getStatCards().map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
              >
                <dt>
                  <div className={`absolute ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 
                    stat.changeType === 'unavailable' ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                </dd>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="/dashboard/admin/categories"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                    <FolderOpen className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Manage Categories
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create and organize product categories
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/admin/products"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <Package className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Manage Products
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Review and manage all products
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/admin/users"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <Users className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Manage Users
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View and manage user accounts
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity 
          limit={5} 
          showRefresh={true}
          onActivityClick={(activity) => {
            if (activity.target?.url) {
              window.open(activity.target.url, '_blank');
            }
          }}
        />
      </div>
    </AdminLayout>
  );
}
