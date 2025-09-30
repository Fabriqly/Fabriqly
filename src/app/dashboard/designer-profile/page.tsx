'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignerProfile } from '@/types/enhanced-products';
import { DesignerProfileForm } from '@/components/designer/DesignerProfileForm';
import { DesignerProfileDisplay } from '@/components/designer/DesignerProfileDisplay';
import { Button } from '@/components/ui/Button';
import { 
  Edit, 
  Plus, 
  User, 
  Star, 
  Eye, 
  Download, 
  TrendingUp,
  Award,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';

export default function DesignerProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth(true, 'designer');
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/unauthorized');
      return;
    }
    
    if (user && user.role !== 'designer' && user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    // Only load profile once when user is available and we haven't loaded yet
    if (user && !hasLoaded) {
      loadProfile();
      setHasLoaded(true);
    }
  }, [user, isLoading, router, hasLoaded]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/designer-profiles?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        if (data.profiles && data.profiles.length > 0) {
          setProfile(data.profiles[0]);
        } else {
          setProfile(null);
        }
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (savedProfile: DesignerProfile) => {
    setProfile(savedProfile);
    setIsEditing(false);
    // No need to reload - we already have the saved profile data
  };

  // Prevent session refresh on window focus to avoid alt+tab reloads
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Do nothing - prevent automatic session refresh
    };

    const handleFocus = () => {
      // Do nothing - prevent automatic session refresh
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadProfile}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Designer Profile</h1>
              <p className="text-gray-600 mt-1">
                {profile ? 'Manage your designer profile and showcase your work' : 'Create your designer profile to get started'}
              </p>
            </div>
            {profile && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {!profile && !isEditing ? (
          /* No Profile - Show Create Button */
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <User className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Found</h2>
            <p className="text-gray-600 mb-6">
              Create your designer profile to showcase your work and connect with customers.
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Profile</span>
            </Button>
          </div>
        ) : isEditing ? (
          /* Edit Mode */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <DesignerProfileForm
              profile={profile || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          /* Display Mode */
          <div className="space-y-6">
            {/* Profile Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <DesignerProfileDisplay
                profile={profile}
                showActions={true}
                onEdit={() => setIsEditing(true)}
              />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Designs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.portfolioStats.totalDesigns || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Download className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.portfolioStats.totalDownloads || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.portfolioStats.totalViews || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.portfolioStats.averageRating || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push('/dashboard/designs')}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Design</span>
                </Button>
                
                <Button
                  onClick={() => router.push('/dashboard/designs')}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>View Analytics</span>
                </Button>
                
                <Button
                  onClick={() => router.push('/designs')}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 h-12"
                >
                  <Globe className="h-4 w-4" />
                  <span>View Public Profile</span>
                </Button>
              </div>
            </div>

            {/* Verification Status */}
            {!profile.isVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Profile Verification
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your profile is not yet verified. Verification helps build trust with customers 
                        and can increase your visibility on the platform.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" variant="outline" className="text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                        Request Verification
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
