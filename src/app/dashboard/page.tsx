'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { User, LogOut, Settings, Bell } from 'lucide-react';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { useState, useEffect } from 'react';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  businessName?: string;
  businessType?: string;
  specialties?: string[];
  portfolioUrl?: string;
}

function DashboardContent() {
  const { user, isCustomer, isDesigner, isBusinessOwner, isAdmin } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleEditProfile = () => {
    setIsProfileModalOpen(true);
  };

  const handleProfileSaved = (updatedProfile: ProfileData) => {
    setProfileData(updatedProfile);
  };

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const { user: userData } = await response.json();
          setProfileData(userData.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Get display name from profile data or fallback to session data
  const displayName = profileData?.firstName && profileData?.lastName 
    ? `${profileData.firstName} ${profileData.lastName}` 
    : user?.name || user?.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {displayName}!
              </h2>
              <p className="text-gray-600">
                Role: <span className="capitalize font-medium">{user?.role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Role-based Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isCustomer && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Browse Products</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Discover unique designs and custom products from talented designers.
                </p>
                <Button size="sm">Explore Products</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Orders</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Track your orders and view order history.
                </p>
                <Button variant="outline" size="sm">View Orders</Button>
              </div>
            </>
          )}

          {isDesigner && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Designs</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage your design portfolio and uploads.
                </p>
                <Button size="sm">Manage Designs</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Earnings</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View your earnings and commission details.
                </p>
                <Button variant="outline" size="sm">View Earnings</Button>
              </div>
            </>
          )}

          {isBusinessOwner && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Shop</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage your shop settings and products.
                </p>
                <Button size="sm">Manage Shop</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Orders</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View and process customer orders.
                </p>
                <Button variant="outline" size="sm">View Orders</Button>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage users, roles, and permissions.
                </p>
                <Button size="sm">Manage Users</Button>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">System Analytics</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View platform statistics and analytics.
                </p>
                <Button variant="outline" size="sm">View Analytics</Button>
              </div>
            </>
          )}

          {/* Common sections for all roles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Settings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Update your profile information and preferences.
            </p>
            <Button variant="outline" size="sm" onClick={handleEditProfile}>Edit Profile</Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">
                {isCustomer ? 'Orders' : isDesigner ? 'Designs' : isBusinessOwner ? 'Products' : 'Total Users'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$0</div>
              <div className="text-sm text-gray-600">
                {isCustomer ? 'Spent' : 'Earnings'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Messages</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileSaved}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
