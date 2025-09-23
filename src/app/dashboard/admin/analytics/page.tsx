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
  Heart
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

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load analytics data
      const [usersRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/categories')
      ]);

      const [users, products, orders, categories] = await Promise.all([
        usersRes.json(),
        productsRes.json(),
        ordersRes.json(),
        categoriesRes.json()
      ]);

      // Calculate overview stats
      const overview = {
        totalUsers: users.users?.length || 0,
        totalProducts: products.products?.length || 0,
        totalOrders: orders.orders?.length || 0,
        totalRevenue: orders.totalRevenue || 0,
        activeProducts: products.products?.filter((p: any) => p.status === 'active').length || 0,
        pendingOrders: orders.orders?.filter((o: any) => o.status === 'pending').length || 0
      };

      // Generate mock data for charts (in real app, this would come from analytics API)
      const userGrowth = generateUserGrowthData();
      const productStats = generateProductStatsData(categories.categories || []);
      const revenueData = generateRevenueData();
      const topProducts = generateTopProductsData(products.products || []);

      setAnalytics({
        overview,
        userGrowth,
        productStats,
        revenueData,
        topProducts
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowthData = () => {
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 10) + 1
      });
    }
    return data;
  };

  const generateProductStatsData = (categories: any[]) => {
    return categories.map(category => ({
      category: category.categoryName,
      count: Math.floor(Math.random() * 50) + 1
    }));
  };

  const generateRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      revenue: Math.floor(Math.random() * 10000) + 1000
    }));
  };

  const generateTopProductsData = (products: any[]) => {
    return products.slice(0, 5).map(product => ({
      id: product.id,
      name: product.name,
      views: Math.floor(Math.random() * 1000) + 100,
      orders: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 5000) + 500
    }));
  };

  const overviewCards = [
    {
      name: 'Total Users',
      value: analytics.overview.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Products',
      value: analytics.overview.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Orders',
      value: analytics.overview.totalOrders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Total Revenue',
      value: `$${analytics.overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+23%',
      changeType: 'positive'
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
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
            <div className="h-64 flex items-end space-x-2">
              {analytics.userGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-full"
                    style={{ height: `${(data.users / Math.max(...analytics.userGrowth.map(d => d.users))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
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
