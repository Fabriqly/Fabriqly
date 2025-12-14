'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DesignerVerificationRequest } from '@/types/enhanced-products';
import { Search, Calendar, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';

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
  const [allProfiles, setAllProfiles] = useState<DesignerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [selectedProfile, setSelectedProfile] = useState<DesignerProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'suspend' | 'restore' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Calculate stats from all profiles
  const stats = {
    totalPending: allProfiles.filter(p => !p.isVerified && p.isActive && p.verificationRequest?.status === 'pending').length,
    totalApproved: allProfiles.filter(p => p.isVerified && p.isActive).length,
    totalRejected: allProfiles.filter(p => p.verificationRequest?.status === 'rejected' || (!p.isVerified && !p.isActive && !p.verificationRequest?.status)).length,
    totalSuspended: allProfiles.filter(p => p.isVerified && !p.isActive).length,
  };

  // Get profiles for current tab
  const getCurrentProfiles = () => {
    let filtered: DesignerProfile[] = [];
    
    switch (activeTab) {
      case 'pending':
        filtered = allProfiles.filter(p => !p.isVerified && p.isActive && p.verificationRequest?.status === 'pending');
        break;
      case 'approved':
        filtered = allProfiles.filter(p => p.isVerified && p.isActive);
        break;
      case 'rejected':
        filtered = allProfiles.filter(p => p.verificationRequest?.status === 'rejected' || (!p.isVerified && !p.isActive && !p.verificationRequest?.status));
        break;
      case 'suspended':
        filtered = allProfiles.filter(p => p.isVerified && !p.isActive);
        break;
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.businessName?.toLowerCase().includes(searchLower) ||
        profile.bio?.toLowerCase().includes(searchLower) ||
        profile.specialties.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const getDate = (profile: DesignerProfile) => {
        if (!profile.createdAt) return 0;
        try {
          const date = profile.createdAt instanceof Date ? profile.createdAt : new Date(profile.createdAt);
          return date.getTime();
        } catch {
          return 0;
        }
      };
      
      const dateA = getDate(a);
      const dateB = getDate(b);
      
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const toggleCardExpansion = (profileId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '100'); // Fetch all to calculate stats

      const response = await fetch(`/api/admin/designer-verification?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const data = await response.json();
      setAllProfiles(data.profiles || []);
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
        setShowModal(false);
        setSelectedProfile(null);
        setPendingAction(null);
        setActionReason('');
        setActionNotes('');
        
        // Refresh the list
        await fetchProfiles();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (profile: DesignerProfile) => {
    if (profile.isVerified && !profile.isActive) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Suspended</span>;
    }
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
    // Suspended profiles (verified but inactive)
    if (profile.isVerified && !profile.isActive) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(profile, 'restore')}
            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            Restore
          </button>
          <button
            onClick={() => handleAction(profile, 'reject')}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Revoke
          </button>
        </div>
      );
    }
    // Verified and active profiles
    if (profile.isVerified && profile.isActive) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(profile, 'suspend')}
            className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded transition-colors"
          >
            Suspend
          </button>
          <button
            onClick={() => handleAction(profile, 'reject')}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Revoke
          </button>
        </div>
      );
    }
    // Rejected profiles (not verified and not active)
    if (profile.verificationRequest?.status === 'rejected' || (!profile.isVerified && !profile.isActive)) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(profile, 'approve')}
            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(profile, 'restore')}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Restore
          </button>
        </div>
      );
    }
    // Pending or new profiles
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction(profile, 'approve')}
          className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => handleAction(profile, 'reject')}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Reject
        </button>
      </div>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const currentProfiles = getCurrentProfiles();

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Designer Verification</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatCard label="Pending" value={stats.totalPending} color="yellow" />
          <StatCard label="Approved" value={stats.totalApproved} color="green" />
          <StatCard label="Rejected" value={stats.totalRejected} color="red" />
          <StatCard label="Suspended" value={stats.totalSuspended} color="gray" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({stats.totalPending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved ({stats.totalApproved})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'rejected'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Rejected ({stats.totalRejected})
              </button>
              <button
                onClick={() => setActiveTab('suspended')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'suspended'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Suspended ({stats.totalSuspended})
              </button>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search designers by name, bio, or specialties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              {/* Sort Button */}
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Sort by Date</span>
                <span className="sm:hidden">Date</span>
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading designer profiles...</p>
              </div>
            ) : (
              <>
                {currentProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-2">
                      {searchTerm.trim() 
                        ? `No designers found matching "${searchTerm}"` 
                        : 'No designers found'}
                    </p>
                    {searchTerm.trim() && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentProfiles.map((profile) => {
                      const isExpanded = expandedCards.has(profile.id);
                      
                      return (
                        <div key={profile.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          {/* Header - Always Visible */}
                          <div className="p-4 md:p-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => toggleCardExpansion(profile.id)}
                                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">{profile.businessName}</h3>
                                    {getStatusBadge(profile)}
                                  </div>
                                  {!isExpanded && (
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                      <span>Designs: {profile.portfolioStats.totalDesigns}</span>
                                      <span>Rating: {profile.portfolioStats.averageRating.toFixed(1)}/5</span>
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(profile.createdAt)}
                                      </span>
                                      {profile.specialties.length > 0 && (
                                        <span className="text-xs">
                                          {profile.specialties.slice(0, 2).join(', ')}
                                          {profile.specialties.length > 2 && ` +${profile.specialties.length - 2} more`}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex md:flex-col gap-2 flex-shrink-0">
                                {getActionButtons(profile)}
                              </div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {isExpanded && (
                            <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-gray-100 pt-4 md:pt-6">
                              {profile.bio && (
                                <p className="text-gray-600 mb-4 max-w-3xl text-sm md:text-base">{profile.bio}</p>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
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
                                    <div>Rating: {profile.portfolioStats.averageRating.toFixed(1)}/5</div>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Contact:</span>
                                  <div className="mt-1">
                                    {profile.website && (
                                      <div>
                                        Website: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.website}</a>
                                      </div>
                                    )}
                                    {profile.socialMedia && Object.entries(profile.socialMedia).map(([platform, url]) => (
                                      url && (
                                        <div key={platform}>
                                          {platform}: <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                                <Calendar className="w-3.5 h-3.5" />
                                Created: {formatDate(profile.createdAt)}
                              </div>
                              
                              {profile.verificationRequest && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                  <h4 className="font-medium text-gray-900 mb-2">Verification Request Details:</h4>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    {profile.verificationRequest.portfolioUrl && (
                                      <div>
                                        Portfolio: <a href={profile.verificationRequest.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{profile.verificationRequest.portfolioUrl}</a>
                                      </div>
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
                                      <div>Document Submitted: {formatDate(profile.verificationRequest.submittedAt)}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
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
                      ? 'bg-red-600 hover:bg-red-700'
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
    </AdminLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-lg border p-3 md:p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
      <div className="text-xs md:text-sm font-medium">{label}</div>
    </div>
  );
}
