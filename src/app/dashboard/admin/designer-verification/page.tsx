'use client';

import React, { useState, useEffect } from 'react';
import { DesignerVerificationRequest } from '@/types/enhanced-products';

interface DesignerProfile {
  id: string;
  businessName: string;
  bio?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
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

export default function DesignerVerificationPage() {
  const [profiles, setProfiles] = useState<DesignerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProfile, setSelectedProfile] = useState<DesignerProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'suspend' | 'restore' | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [statusFilter]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/admin/designer-verification?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();
      setProfiles(data.profiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (profile: DesignerProfile, action: 'approve' | 'reject' | 'suspend' | 'restore') => {
    setSelectedProfile(profile);
    setPendingAction(action);
    setActionReason('');
    setActionNotes('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedProfile || !pendingAction) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/designer-verification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: pendingAction,
          designerId: selectedProfile.id,
          reason: actionReason,
          notes: actionNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update designer status');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the local state
        setProfiles(prevProfiles =>
          prevProfiles.map(profile =>
            profile.id === selectedProfile.id
              ? { ...profile, ...data.designer, verificationRequest: { ...profile.verificationRequest, status: data.status } }
              : profile
          )
        );
        
        setShowModal(false);
        setSelectedProfile(null);
        setPendingAction(null);
        setActionReason('');
        setActionNotes('');
        
        // Optionally refresh the list
        await fetchProfiles();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (profile: DesignerProfile) => {
    if (profile.isVerified) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Verified</span>;
    }
    if (profile.verificationRequest?.status === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rejected</span>;
    }
    if (profile.verificationRequest?.status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pending</span>;
    }
    if (!profile.isActive) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Inactive</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">New</span>;
  };

  const getActionButtons = (profile: DesignerProfile) => {
    if (profile.isVerified) {
      return (
        <div className="space-x-2">
          <button
            onClick={() => handleAction(profile, 'reject')}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Revoke
          </button>
          <button
            onClick={() => handleAction(profile, 'suspend')}
            className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Suspend
          </button>
        </div>
      );
    } else if (profile.verificationRequest?.status === 'rejected' || !profile.isActive) {
      return (
        <div className="space-x-2">
          <button
            onClick={() => handleAction(profile, 'approve')}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(profile, 'restore')}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Restore
          </button>
        </div>
      );
    } else {
      return (
        <div className="space-x-2">
          <button
            onClick={() => handleAction(profile, 'approve')}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(profile, 'reject')}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      );
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Designer Verification Management</h1>
          
          {/* Status Filter */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({profiles.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending (
                {profiles.filter(p => !p.isVerified && p.isActive && p.verificationRequest?.status === 'pending').length}
              )
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'approved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Approved ({profiles.filter(p => p.isVerified).length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === 'rejected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rejected ({profiles.filter(p => p.verificationRequest?.status === 'rejected' || !p.isActive).length})
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
        </div>

        {/* Profiles List */}
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{profile.businessName}</h3>
                    {getStatusBadge(profile)}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-600 mb-3 max-w-3xl">{profile.bio}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.specialties.map((specialty, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Portfolio Stats:</span>
                      <div className="mt-1">
                        <div>Designs: {profile.portfolioStats.totalDesigns}</div>
                        <div>Views: {profile.portfolioStats.totalViews}</div>
                        <div>Downloads: {profile.portfolioStats.totalDownloads}</div>
                        <div>Rating: {profile.portfolioStats.averageRating}/5</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span>
                      <div className="mt-1">
                        {profile.website && <div>Website: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.website}</a></div>}
                        {profile.socialMedia && Object.entries(profile.socialMedia).map(([platform, url]) => (
                          url && <div key={platform}>Social: <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{platform}</a></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <div>Created: {formatDate(profile.createdAt)}</div>
                    <div>Updated: {formatDate(profile.updatedAt)}</div>
                  </div>
                  
                  {profile.verificationRequest && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Verification Request Details:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {profile.verificationRequest.portfolioUrl && (
                          <div>Portfolio: <a href={profile.verificationRequest.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.verificationRequest.portfolioUrl}</a></div>
                        )}
                        {profile.verificationRequest.portfolioDescription && (
                          <div>Description: {profile.verificationRequest.portfolioDescription}</div>
                        )}
                        {profile.verificationRequest.yearsExperience && (
                          <div>Experience: {profile.verificationRequest.yearsExperience} years</div>
                        )}
                        {profile.verificationRequest.specializations && profile.verificationRequest.specializations.length > 0 && (
                          <div>
                            Specializations: {profile.verificationRequest.specializations.join(', ')}
                          </div>
                        )}
                        {profile.verificationRequest.documentSubmitted && (
                          <div>Document Submitted: {profile.verificationRequest.submittedAt}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-6">
                  {getActionButtons(profile)}
                </div>
              </div>
            </div>
          ))}
          
          {profiles.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No designer profiles found for the selected status.</p>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showModal && selectedProfile && pendingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {pendingAction === 'approve' && 'Approve Designer Verification'}
                {pendingAction === 'reject' && 'Reject Designer Verification'}
                {pendingAction === 'suspend' && 'Suspend Designer Account'}
                {pendingAction === 'restore' && 'Restore Designer Account'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                You are about to {pendingAction} {selectedProfile.businessName}.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {pendingAction === 'approve' || pendingAction === 'restore' ? '(optional)' : '(required)'}
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reason for this action..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={loading || (pendingAction !== 'approve' && pendingAction !== 'restore' && !actionReason.trim())}
                  className={`px-4 py-2 text-white rounded-md ${
                    pendingAction === 'approve' || pendingAction === 'restore'
                      ? 'bg-green-600 hover:bg-green-700'
                      : pendingAction === 'reject'
                      ? 'bg-red-600 hover.7'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Processing...' : `Confirm ${pendingAction}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
