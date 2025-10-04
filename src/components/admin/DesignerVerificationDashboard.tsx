'use client';

import React, { useState, useEffect } from 'react';
import { DesignerVerificationRequest } from '@/types/enhanced-products';

interface VerificationStats {
  totalPending: number;
  totalVerified: number;
  totalRejected: number;
  totalActive: number;
}

interface DesignerProfile {
  id: string;
  businessName: string;
  bio?: string;
  website?: string;
  specialties: string[];
  portfolioStats: {
    totalDesigns: number;
    totalDownloads: number;
    totalViews: number;
    averageRating: number;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  verificationRequest: DesignerVerificationRequest | null;
}

export default function DesignerVerificationDashboard() {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Using the designer verification API to get stats
      const response = await fetch('/api/admin/designer-verification');
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification stats');
      }

      const data = await response.json();
      
      // Calculate stats from the profiles data
      const profiles: DesignerProfile[] = data.profiles || [];
      
      const calculatedStats = {
        totalPending: profiles.filter(p => !p.isVerified && p.isActive && p.verificationRequest?.status === 'pending').length,
        totalVerified: profiles.filter(p => p.isVerified && p.isActive).length,
        totalRejected: profiles.filter(p => p.verificationRequest?.status === 'rejected' || (!p.isVerified && !p.isActive)).length,
        totalActive: profiles.filter(p => p.isActive).length
      };
      
      setStats(calculatedStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon }: {
    title: string;
    value: number;
    color: 'blue' | 'green' | 'yellow' | 'red';
    icon: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200'
    };

    const iconColors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    };

    return (
      <div className={`p-6 border rounded-lg ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`text-2xl ${iconColors[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="road" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Stats</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Designer Verification</h2>
          <p className="text-gray-600 mt-1">
            Manage designer verification requests and monitor verification status
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => window.location.href = '/dashboard/admin/designer-verification'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Manage Verifications
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Requests"
          value={stats?.totalPending || 0}
          color="yellow"
          icon="⏳"
        />
        <StatCard
          title="Verified Designers"
          value={stats?.totalVerified || 0}
          color="green"
          icon="✅"
        />
        <StatCard
          title="Rejected/Suspended"
          value={stats?.totalRejected || 0}
          color="red"
          icon="❌"
        />
        <StatCard
          title="Total Active"
          value={stats?.totalActive || 0}
          color="blue"
          icon="👥"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="text-blue-600 text-xl mr-3">📊</div>
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Approved today:</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>New requests:</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. review time:</span>
              <span className="font-medium">2-3 days</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="text-green-600 text-xl mr-3">⚡</div>
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/dashboard/admin/designer-verification?status=pending'}
              className="w-full px-3 py-2 text-left text-sm bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
            >
              Review Pending Requests ({stats?.totalPending || 0})
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/admin/designer-verification?status=rejected'}
              className="w-full px-3 py-2 text-left text-sm bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            >
              Review Rejected ({stats?.totalRejected || 0})
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/admin/designer-verification?status=approved'}
              className="w-full px-3 py-2 text-left text-sm bg-green-100 hover:bg-green-200 rounded-md transition-colors"
            >
              View Verified ({stats?.totalVerified || 0})
            </button>
          </div>
        </div>

        {/* Verification Guidelines */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="text-purple-600 text-xl mr-3">📋</div>
            <h3 className="text-lg font-medium text-gray-900">Guidelines</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Review portfolio quality and professionalism</t>
            <p>• Verify contact information accuracy</p>
            <p>• Check for appropriate specializations</p>
            <p>• Ensure business name meets standards</p>
            <p>• Look for consistent design style</p>
          </div>
        </div>
      </div>

      {/* Verification Process Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Process Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              1
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Submit Request</h4>
            <p className="text-sm text-gray-600">Designers submit verification request with portfolio</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              2
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Admin Review</h4>
            <p className="text-sm text-gray-600">Admin reviews portfolio and background</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              3
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Decision Made</h4>
            <p className="text-sm text-gray-600">Admin approves or rejects verification</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
              4
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Status Updated</h4>
            <p className="text-sm text-gray-600">Designer receives verification badge</p>
          </div>
        </div>
      </div>
    </div>
  );
}

