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
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

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
      checkVerifiedBannerVisibility();
      setHasLoaded(true);
    }
  }, [user, isLoading, router, hasLoaded]);

  const checkVerifiedBannerVisibility = () => {
    if (typeof window !== 'undefined') {
      const bannerClosed = localStorage.getItem(`designer-verified-banner-closed-${user?.id}`);
      setShowVerifiedBanner(!bannerClosed);
    }
  };

  const handleCloseVerifiedBanner = () => {
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`designer-verified-banner-closed-${user.id}`, 'true');
      setShowVerifiedBanner(false);
    }
  };

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
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-6xl mx-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {!profile ? (
                <div className="max-w-2xl mx-auto text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm border p-8">
                    <svg
                      className="w-24 h-24 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">No Designer Profile Yet</h2>
                    <p className="text-gray-600 mb-6">
                      Create your designer profile to showcase your work and connect with customers.
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Create Designer Profile
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Edit Designer Profile</h1>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                  <DesignerProfileForm
                    profile={profile || undefined}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    {/* Title Section */}
                    <div className="mb-4">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Designer Profile</h1>
                    </div>
                    
                    {/* Action Buttons - Stack on mobile, horizontal on desktop */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <a
                        href={`/explore/designers/${profile.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm sm:text-base"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Public Page
                      </a>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm sm:text-base"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Status Banner */}
                  {profile && verificationStatus && (
              <>
                    {/* Approved Status - Closable, One-time View */}
                    {verificationStatus.verificationStatus === 'approved' && showVerifiedBanner && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 relative">
                        <button
                          onClick={handleCloseVerifiedBanner}
                          className="absolute top-4 right-4 text-green-600 hover:text-green-800 transition-colors"
                          aria-label="Close banner"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-start pr-8">
                          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-green-800">Profile Verified ✅</h3>
                            <p className="text-sm text-green-700 mt-1">
                              Congratulations! Your designer profile has been verified. This helps build trust with customers 
                              and increases your visibility on the platform.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pending Status */}
                    {verificationStatus.verificationStatus === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                          <Clock className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
                          <div>
                            <h3 className="font-semibold text-yellow-800">Verification Under Review</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Your verification request is currently under review. We'll notify you once the review is complete.
                            </p>
                            {verificationStatus.verificationRequest?.submittedAt && (
                              <p className="text-xs text-yellow-600 mt-2">
                                Submitted: {new Date(verificationStatus.verificationRequest.submittedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejected Status */}
                    {verificationStatus.verificationStatus === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                          <XCircle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                          <div>
                            <h3 className="font-semibold text-red-800">Verification Rejected</h3>
                            <p className="text-sm text-red-700 mt-1">
                              Your verification request was not approved. You can review the feedback and submit a new request.
                            </p>
                            {verificationStatus.rejectionReason && (
                              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="font-medium text-red-800">Reason:</p>
                                <p className="text-red-700">{verificationStatus.rejectionReason}</p>
                              </div>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => setShowVerificationForm(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                              >
                                <RefreshCw className="h-4 w-4 inline mr-2" />
                                Re-submit Verification Request
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suspended Status */}
                    {verificationStatus.verificationStatus === 'suspended' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3" />
                          <div>
                            <h3 className="font-semibold text-red-800">Account Suspended</h3>
                            <p className="text-sm text-red-700 mt-1">
                              Your designer account has been suspended. You can submit an appeal to request a review of this decision.
                            </p>
                            {verificationStatus.suspensionReason && (
                              <div className="mt-3 p-3 bg-red-100 rounded-lg">
                                <p className="font-medium text-red-800">Reason:</p>
                                <p className="text-red-700">{verificationStatus.suspensionReason}</p>
                              </div>
                            )}
                            <div className="mt-4">
                              <button
                                onClick={() => setShowAppealForm(true)}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
                              >
                                <MessageSquare className="h-4 w-4 inline mr-2" />
                                Submit Appeal
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Not Requested Status */}
                    {verificationStatus.verificationStatus === 'not_requested' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                          <Award className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
                          <div>
                            <h3 className="font-semibold text-yellow-800">Profile Verification</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Your profile is not yet verified. Verification helps build trust with customers 
                              and can increase your visibility on the platform.
                            </p>
                            <div className="mt-4">
                              <button
                                onClick={() => setShowVerificationForm(true)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                              >
                                Request Verification
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                  )}

                  {/* Profile Display - Using DesignerProfileDisplay component with shop profile style */}
                  {profile && (
                    <DesignerProfileDisplay
                      profile={profile}
                      showActions={false}
                      onEdit={() => setIsEditing(true)}
                    />
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
