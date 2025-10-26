'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesignerProfile } from '@/types/enhanced-products';
import { DesignerProfileForm } from '@/components/designer/DesignerProfileForm';
import { DesignerProfileDisplay } from '@/components/designer/DesignerProfileDisplay';
import VerificationRequestForm from '@/components/designer/VerificationRequestForm';
import DesignerAppealForm from '@/components/designer/DesignerAppealForm';
import { Button } from '@/components/ui/Button';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
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
  Linkedin,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare
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
  const [syncingStats, setSyncingStats] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

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
      loadVerificationStatus();
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

  const loadVerificationStatus = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingStatus(true);
      const response = await fetch('/api/designer-verification-status');
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus(data);
      } else {
        console.error('Failed to load verification status:', data.error);
      }
    } catch (error: any) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSave = async (savedProfile: DesignerProfile) => {
    setProfile(savedProfile);
    setIsEditing(false);
    // Reload verification status after profile update
    loadVerificationStatus();
  };

  const handleVerificationSuccess = () => {
    loadVerificationStatus();
  };

  const handleAppealSuccess = () => {
    loadVerificationStatus();
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

  const handleSyncStats = async () => {
    if (!profile?.id) return;
    
    try {
      setSyncingStats(true);
      const response = await fetch(`/api/designer-profiles/sync-stats?designerId=${profile.id}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        console.log('✅ Stats synced successfully');
      } else {
        throw new Error(data.error || 'Failed to sync stats');
      }
    } catch (error: any) {
      console.error('❌ Error syncing stats:', error);
      setError(error.message || 'Failed to sync stats');
    } finally {
      setSyncingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <User className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadProfile}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-4xl mx-auto">
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
              <div className="flex space-x-3">
                <Button
                  onClick={handleSyncStats}
                  disabled={syncingStats}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncingStats ? 'animate-spin' : ''}`} />
                  <span>{syncingStats ? 'Syncing...' : 'Sync Stats'}</span>
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
              </div>
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
              {profile && (
                <DesignerProfileDisplay
                  profile={profile}
                  showActions={true}
                  onEdit={() => setIsEditing(true)}
                />
              )}
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
                      {profile?.portfolioStats?.totalDesigns || 0}
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
                      {profile?.portfolioStats?.totalDownloads || 0}
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
                      {profile?.portfolioStats?.totalViews || 0}
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
                      {profile?.portfolioStats?.averageRating || 0}
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
            {profile && verificationStatus && (
              <>
                {/* Approved Status */}
                {verificationStatus.verificationStatus === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Profile Verified ✅
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            Congratulations! Your designer profile has been verified. This helps build trust with customers 
                            and increases your visibility on the platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Status */}
                {verificationStatus.verificationStatus === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Verification Under Review
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Your verification request is currently under review. We'll notify you once the review is complete.
                          </p>
                          {verificationStatus.verificationRequest?.submittedAt && (
                            <p className="mt-1">
                              Submitted: {new Date(verificationStatus.verificationRequest.submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected Status */}
                {verificationStatus.verificationStatus === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Verification Rejected
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            Your verification request was not approved. You can review the feedback and submit a new request.
                          </p>
                          {verificationStatus.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                              <p className="font-medium text-red-800">Reason:</p>
                              <p className="text-red-700">{verificationStatus.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-800 border-red-300 hover:bg-red-100"
                            onClick={() => setShowVerificationForm(true)}
                          >
                            Re-submit Verification Request
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suspended Status */}
                {verificationStatus.verificationStatus === 'suspended' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Account Suspended
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>
                            Your designer account has been suspended. You can submit an appeal to request a review of this decision.
                          </p>
                          {verificationStatus.suspensionReason && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg">
                              <p className="font-medium text-red-800">Reason:</p>
                              <p className="text-red-700">{verificationStatus.suspensionReason}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => setShowAppealForm(true)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Submit Appeal
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Not Requested Status */}
                {verificationStatus.verificationStatus === 'not_requested' && (
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                            onClick={() => setShowVerificationForm(true)}
                          >
                            Request Verification
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Verification Request Modal */}
        {showVerificationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Request Verification</h2>
                  <button
                    onClick={() => setShowVerificationForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <VerificationRequestForm />
              </div>
            </div>
          </div>
        )}

        {/* Appeal Form Modal */}
        <DesignerAppealForm
          isOpen={showAppealForm}
          onClose={() => setShowAppealForm(false)}
          onSuccess={handleAppealSuccess}
          suspensionReason={verificationStatus?.suspensionReason}
        />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
