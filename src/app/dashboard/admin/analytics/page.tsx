'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  ShoppingCart,
  Eye,
  Heart,
  X
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    activeProducts: number;
    pendingOrders: number;
  };
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  productStats: Array<{
    category: string;
    count: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    views: number;
    orders: number;
    revenue: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: 0,
      pendingOrders: 0
    },
    userGrowth: [],
    productStats: [],
    revenueData: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showUserGrowthInfo, setShowUserGrowthInfo] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get dashboard stats first (includes all overview data)
      const statsResponse = await fetch(`/api/dashboard-stats?period=${timeRange}`);
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const statsData = await statsResponse.json();
      
      // Extract overview stats from dashboard-stats to avoid duplicate queries
      const overview = {
        totalUsers: statsData.current.totalUsers,
        totalProducts: statsData.current.totalProducts,
        totalOrders: statsData.current.totalOrders,
        totalRevenue: statsData.current.totalRevenue,
        activeProducts: statsData.current.activeProducts,
        pendingOrders: statsData.current.pendingOrders
      };
      
      // Only fetch analytics-specific data if we need charts
      const analyticsResponse = await fetch(`/api/analytics?timeRange=${timeRange}`);
      
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await analyticsResponse.json();
      
      // Combine the data instead of duplicating queries
      setAnalytics({
        overview,
        userGrowth: analyticsData.userGrowth,
        productStats: analyticsData.productStats,
        revenueData: analyticsData.revenueData,
        topProducts: analyticsData.topProducts
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };


  interface PercentageChange {
    value: number | null;
    type: 'positive' | 'negative' | 'neutral' | 'unavailable';
    label?: string;
  }

  const [percentageChanges, setPercentageChanges] = useState<{
    totalUsers: PercentageChange;
    totalProducts: PercentageChange;
    totalOrders: PercentageChange;
    totalRevenue: PercentageChange;
  }>({
    totalUsers: { value: 0, type: 'neutral' },
    totalProducts: { value: 0, type: 'neutral' },
    totalOrders: { value: 0, type: 'neutral' },
    totalRevenue: { value: 0, type: 'neutral' }
  });

  // Load percentage changes from dashboard-stats API
  useEffect(() => {
    const loadPercentageChanges = async () => {
      try {
        const response = await fetch(`/api/dashboard-stats?period=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setPercentageChanges({
            totalUsers: data.percentageChanges?.totalUsers || { value: 0, type: 'neutral' },
            totalProducts: data.percentageChanges?.totalProducts || { value: 0, type: 'neutral' },
            totalOrders: data.percentageChanges?.totalOrders || { value: 0, type: 'neutral' },
            totalRevenue: data.percentageChanges?.totalRevenue || { value: 0, type: 'neutral' }
          });
        }
      } catch (error) {
        console.error('Error loading percentage changes:', error);
      }
    };
    
    loadPercentageChanges();
  }, [timeRange]);

  const formatChange = (change: PercentageChange) => {
    if (change.type === 'unavailable') {
      return change.label || 'No data';
    }
    if (change.value === 0 || change.value === null) return '0%';
    const sign = change.type === 'positive' ? '+' : change.type === 'negative' ? '-' : '';
    return `${sign}${change.value}%`;
  };

  const overviewCards = [
    {
      name: 'Total Users',
      value: analytics.overview.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: formatChange(percentageChanges.totalUsers),
      changeType: percentageChanges.totalUsers.type
    },
    {
      name: 'Total Products',
      value: analytics.overview.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      change: formatChange(percentageChanges.totalProducts),
      changeType: percentageChanges.totalProducts.type
    },
    {
      name: 'Total Orders',
      value: analytics.overview.totalOrders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      change: formatChange(percentageChanges.totalOrders),
      changeType: percentageChanges.totalOrders.type
    },
    {
      name: 'Total Revenue',
      value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: formatChange(percentageChanges.totalRevenue),
      changeType: percentageChanges.totalRevenue.type
    }
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Platform performance and insights
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((stat) => {
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily User Registrations</h3>
            <div className="h-64 flex items-end space-x-2">
              {analytics.userGrowth.map((data, index) => {
                const maxUsers = Math.max(...analytics.userGrowth.map(d => d.users), 1);
                const barHeight = (data.users / maxUsers) * 200;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-t w-full relative group"
                      style={{ height: `${barHeight}px` }}
                      title={`${data.users} new users registered`}
                    >
                      {data.users > 0 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {data.users}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {data.users > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {data.users}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {showUserGrowthInfo && (
              <div className="mt-4 relative bg-blue-50 border border-blue-200 rounded-lg p-3">
                <button
                  onClick={() => setShowUserGrowthInfo(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Hide instructions"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-sm text-blue-800 pr-6">
                  <p>💡 Hover over bars to see exact registration counts</p>
                  <p>📊 Shows daily new user registrations for the selected period</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Categories Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Products by Category</h3>
            <div className="space-y-3">
              {analytics.productStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stat.count / Math.max(...analytics.productStats.map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="h-64 flex items-end space-x-2">
            {analytics.revenueData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="bg-emerald-500 rounded-t w-full"
                  style={{ height: `${(data.revenue / Math.max(...analytics.revenueData.map(d => d.revenue))) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                <span className="text-xs text-gray-700 mt-1">${data.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Performing Products
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 text-gray-400 mr-1" />
                          {product.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 text-gray-400 mr-1" />
                          {product.orders}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          ${product.revenue.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
