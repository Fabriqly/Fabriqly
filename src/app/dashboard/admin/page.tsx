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
  value: number;
  type: 'positive' | 'negative' | 'neutral';
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
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    loadDashboardStats();
  }, [period]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/dashboard-stats?period=${period}`);
      const data = await response.json();
      
      if (response.ok) {
        setDashboardData(data);
      } else {
        console.error('Error loading dashboard stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    if (!dashboardData) return [];

    const { current, changes } = dashboardData;

    const formatChange = (change: PercentageChange) => {
      if (change.value === 0) return '0%';
      const sign = change.type === 'positive' ? '+' : change.type === 'negative' ? '-' : '';
      return `${sign}${change.value}%`;
    };

    return [
      {
        name: 'Total Users',
        value: current.totalUsers,
        icon: Users,
        color: 'bg-blue-500',
        change: formatChange(changes.totalUsers),
        changeType: changes.totalUsers.type
      },
      {
        name: 'Total Products',
        value: current.totalProducts,
        icon: Package,
        color: 'bg-green-500',
        change: formatChange(changes.totalProducts),
        changeType: changes.totalProducts.type
      },
      {
        name: 'Categories',
        value: current.totalCategories,
        icon: FolderOpen,
        color: 'bg-purple-500',
        change: formatChange(changes.totalCategories),
        changeType: changes.totalCategories.type
      },
      {
        name: 'Total Orders',
        value: current.totalOrders,
        icon: ShoppingCart,
        color: 'bg-orange-500',
        change: formatChange(changes.totalOrders),
        changeType: changes.totalOrders.type
      },
      {
        name: 'Revenue',
        value: `$${current.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: 'bg-emerald-500',
        change: formatChange(changes.totalRevenue),
        changeType: changes.totalRevenue.type
      },
      {
        name: 'Active Products',
        value: current.activeProducts,
        icon: CheckCircle,
        color: 'bg-green-500',
        change: `${Math.round((current.activeProducts / Math.max(current.totalProducts, 1)) * 100)}%`,
        changeType: 'positive'
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
              </p>
            )}
          </div>
          <div className="flex space-x-2">
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
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
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
