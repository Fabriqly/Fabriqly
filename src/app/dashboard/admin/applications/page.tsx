'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { FileText, Store, Clock, CheckCircle, XCircle, User, Mail, Eye, Download, ExternalLink, MapPin, Phone, Building2, CreditCard, Package, Globe, Tag, X } from 'lucide-react';
import { BusinessDocument } from '@/types/applications';

interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName?: string;
  shopName?: string;
  bio?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: any;
  reviewedAt?: any;
  rejectionReason?: string;
  portfolioUrl?: string;
  specialties?: string[];
  contactInfo?: any;
  address?: any;
  // Shop-specific fields
  businessDocuments?: BusinessDocument[];
  businessRegistrationNumber?: string;
  taxId?: string;
  operatingHours?: { [key: string]: { open: string; close: string; closed?: boolean } };
  profileBanner?: string;
  shopLogo?: string;
  tagline?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
  };
  websiteUrl?: string;
  shopCategory?: string;
  serviceTags?: string[];
  materialSpecialties?: string[];
  paymentMethods?: string[];
  paymentAccountInfo?: string;
  returnPolicy?: string;
  processingTime?: string;
  shippingOptions?: string[];
}

export default function AdminApplicationsPage() {
  const [activeTab, setActiveTab] = useState<'designer' | 'shop'>('designer');
  const [designerApplications, setDesignerApplications] = useState<Application[]>([]);
  const [shopApplications, setShopApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ appId: string; type: 'designer' | 'shop'; action: 'approve' } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);

      // Load designer applications
      const designerRes = await fetch('/api/applications/designer?status=pending');
      if (designerRes.ok) {
        const designerData = await designerRes.json();
        setDesignerApplications(designerData.data || []);
      }

      // Load shop applications
      const shopRes = await fetch('/api/applications/shop?status=pending');
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShopApplications(shopData.data || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (appId: string, type: 'designer' | 'shop') => {
    setPendingAction({ appId, type, action: 'approve' });
    setShowConfirmDialog(true);
  };

  const handleApprove = async () => {
    if (!pendingAction) return;

    try {
      setActionLoading(true);
      setShowConfirmDialog(false);
      const response = await fetch(`/api/applications/${pendingAction.type}/${pendingAction.appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application approved successfully!' });
        setSelectedApplication(null);
        setPendingAction(null);
        loadApplications();
        // Clear message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: `Error: ${data.error || 'Failed to approve application'}` });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      setMessage({ type: 'error', text: 'An error occurred while approving the application' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appId: string, type: 'designer' | 'shop') => {
    if (!rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/applications/${type}/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Application rejected successfully' });
        setSelectedApplication(null);
        setShowRejectModal(false);
        setRejectionReason('');
        loadApplications();
        setTimeout(() => setMessage(null), 5000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: `Error: ${data.error || 'Failed to reject application'}` });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      setMessage({ type: 'error', text: 'An error occurred while rejecting the application' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle serialized Firestore Timestamp (from API)
      else if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Handle ISO string or number
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const pendingDesignerCount = designerApplications.filter(a => a.status === 'pending').length;
  const pendingShopCount = shopApplications.filter(a => a.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Message Banner */}
        {message && (
          <div className={`rounded-lg p-4 flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application Management</h1>
          <p className="text-gray-600 mt-1">Review and manage designer and shop applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Designer Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingDesignerCount}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Shop Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pendingShopCount}</p>
              </div>
              <Store className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('designer')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'designer'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Designer Applications ({pendingDesignerCount})
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shop'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shop Applications ({pendingShopCount})
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading applications...</p>
              </div>
            ) : (
              <div>
                {activeTab === 'designer' && (
                  <div className="space-y-4">
                    {designerApplications.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No pending designer applications</p>
                      </div>
                    ) : (
                      designerApplications.map(app => (
                        <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {app.businessName}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {app.userName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      {app.userEmail}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm mb-4">
                                <p className="text-gray-700"><strong>Bio:</strong> {app.bio}</p>
                                {app.portfolioUrl && (
                                  <p className="text-gray-700">
                                    <strong>Portfolio:</strong>{' '}
                                    <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      View Portfolio
                                    </a>
                                  </p>
                                )}
                                {app.specialties && app.specialties.length > 0 && (
                                  <div>
                                    <strong>Specialties:</strong>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {app.specialties.map(specialty => (
                                        <span key={specialty} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                          {specialty}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-gray-600">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  Applied on {formatDate(app.appliedAt)}
                                </p>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowDetailsModal(true);
                                  }}
                                  disabled={actionLoading}
                                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Full Details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveClick(app.id, 'designer')}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={actionLoading}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'shop' && (
                  <div className="space-y-4">
                    {shopApplications.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No pending shop applications</p>
                      </div>
                    ) : (
                      shopApplications.map(app => (
                        <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <Store className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {app.shopName}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {app.userName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-4 h-4" />
                                      {app.userEmail}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm mb-4">
                                <p className="text-gray-700"><strong>Description:</strong> {app.description}</p>
                                {app.address && (
                                  <p className="text-gray-700">
                                    <strong>Address:</strong> {app.address.street}, {app.address.city}, {app.address.country}
                                  </p>
                                )}
                                {app.contactInfo && (
                                  <p className="text-gray-700">
                                    <strong>Contact:</strong> {app.contactInfo.phone} | {app.contactInfo.email}
                                  </p>
                                )}
                                {app.specialties && app.specialties.length > 0 && (
                                  <div>
                                    <strong>Services:</strong>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {app.specialties.map(specialty => (
                                        <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                          {specialty}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-gray-600">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  Applied on {formatDate(app.appliedAt)}
                                </p>
                              </div>

                              <div className="flex gap-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowDetailsModal(true);
                                  }}
                                  disabled={actionLoading}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Full Details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveClick(app.id, 'shop')}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={actionLoading}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rejection Modal */}
        {showRejectModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this application. This will be visible to the applicant.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter rejection reason..."
              />
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleReject(selectedApplication.id, activeTab)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Rejection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedApplication(null);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Full Details Modal */}
        {showDetailsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {activeTab === 'designer' ? '🎨 Designer' : '🏪 Shop'} Application Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Applicant Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedApplication.userName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedApplication.userEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Applied On:</span>
                      <p className="font-medium">{formatDate(selectedApplication.appliedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Designer Application Details */}
                {activeTab === 'designer' && (
                  <>
                    {/* Business Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Business Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Business Name:</span>
                          <p className="font-medium text-lg">{selectedApplication.businessName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Bio:</span>
                          <p className="text-gray-800 mt-1">{selectedApplication.bio}</p>
                        </div>
                        {selectedApplication.portfolioUrl && (
                          <div>
                            <span className="text-gray-600">Portfolio:</span>
                            <a
                              href={selectedApplication.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline mt-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {selectedApplication.portfolioUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Specialties */}
                    {selectedApplication.specialties && selectedApplication.specialties.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Tag className="w-5 h-5" />
                          Specialties
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {selectedApplication.contactInfo && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Phone className="w-5 h-5" />
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedApplication.contactInfo.phone && (
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <p className="font-medium">{selectedApplication.contactInfo.phone}</p>
                            </div>
                          )}
                          {selectedApplication.contactInfo.website && (
                            <div>
                              <span className="text-gray-600">Website:</span>
                              <a
                                href={selectedApplication.contactInfo.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                                {selectedApplication.contactInfo.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Media */}
                    {selectedApplication.socialMedia && Object.values(selectedApplication.socialMedia).some(v => v) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Social Media
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedApplication.socialMedia.facebook && (
                            <a
                              href={selectedApplication.socialMedia.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Facebook
                            </a>
                          )}
                          {selectedApplication.socialMedia.instagram && (
                            <a
                              href={selectedApplication.socialMedia.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-pink-600 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Instagram
                            </a>
                          )}
                          {selectedApplication.socialMedia.twitter && (
                            <a
                              href={selectedApplication.socialMedia.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Twitter
                            </a>
                          )}
                          {selectedApplication.socialMedia.linkedin && (
                            <a
                              href={selectedApplication.socialMedia.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sample Designs */}
                    {selectedApplication.sampleDesigns && selectedApplication.sampleDesigns.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Sample Designs ({selectedApplication.sampleDesigns.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedApplication.sampleDesigns.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-purple-500 transition-colors"
                            >
                              <img
                                src={url}
                                alt={`Sample ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Shop Application Details */}
                {activeTab === 'shop' && (
                  <>
                    {/* Shop Information */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        Shop Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-600">Shop Name:</span>
                          <p className="font-medium text-lg">{selectedApplication.shopName}</p>
                        </div>
                        {selectedApplication.tagline && (
                          <div>
                            <span className="text-gray-600">Tagline:</span>
                            <p className="text-gray-800 italic">{selectedApplication.tagline}</p>
                          </div>
                        )}
                        {selectedApplication.shopCategory && (
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <p className="font-medium">{selectedApplication.shopCategory}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Description:</span>
                          <p className="text-gray-800 mt-1">{selectedApplication.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Shop Images */}
                    {(selectedApplication.shopLogo || selectedApplication.profileBanner) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Shop Branding</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedApplication.shopLogo && (
                            <div>
                              <span className="text-sm text-gray-600 mb-2 block">Logo:</span>
                              <img
                                src={selectedApplication.shopLogo}
                                alt="Shop Logo"
                                className="w-full h-32 object-contain bg-gray-50 rounded border border-gray-200"
                              />
                            </div>
                          )}
                          {selectedApplication.profileBanner && (
                            <div>
                              <span className="text-sm text-gray-600 mb-2 block">Banner:</span>
                              <img
                                src={selectedApplication.profileBanner}
                                alt="Shop Banner"
                                className="w-full h-32 object-cover rounded border border-gray-200"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {selectedApplication.address && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Address
                        </h4>
                        <div className="text-sm bg-gray-50 p-3 rounded">
                          <p>{selectedApplication.address.street}</p>
                          <p>
                            {selectedApplication.address.city}
                            {selectedApplication.address.state && `, ${selectedApplication.address.state}`}
                            {selectedApplication.address.zipCode && ` ${selectedApplication.address.zipCode}`}
                          </p>
                          <p>{selectedApplication.address.country}</p>
                        </div>
                      </div>
                    )}

                    {/* Contact Information */}
                    {selectedApplication.contactInfo && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Phone className="w-5 h-5" />
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedApplication.contactInfo.phone && (
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <p className="font-medium">{selectedApplication.contactInfo.phone}</p>
                            </div>
                          )}
                          {selectedApplication.contactInfo.email && (
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">{selectedApplication.contactInfo.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Business Registration */}
                    {(selectedApplication.businessRegistrationNumber || selectedApplication.taxId) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Business Registration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedApplication.businessRegistrationNumber && (
                            <div>
                              <span className="text-gray-600">Registration Number:</span>
                              <p className="font-medium">{selectedApplication.businessRegistrationNumber}</p>
                            </div>
                          )}
                          {selectedApplication.taxId && (
                            <div>
                              <span className="text-gray-600">Tax ID:</span>
                              <p className="font-medium">{selectedApplication.taxId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Business Documents */}
                    {selectedApplication.businessDocuments && selectedApplication.businessDocuments.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Business Documents ({selectedApplication.businessDocuments.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedApplication.businessDocuments.map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-sm">{doc.label}</p>
                                  <p className="text-xs text-gray-500">{doc.fileName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {selectedApplication.specialties && selectedApplication.specialties.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Services Offered
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.specialties.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Tags & Material Specialties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedApplication.serviceTags && selectedApplication.serviceTags.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Service Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedApplication.serviceTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedApplication.materialSpecialties && selectedApplication.materialSpecialties.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Material Specialties</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedApplication.materialSpecialties.map((material, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment & Shipping */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedApplication.paymentMethods && selectedApplication.paymentMethods.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Methods
                          </h4>
                          <div className="space-y-1 text-sm">
                            {selectedApplication.paymentMethods.map((method, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{method}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedApplication.shippingOptions && selectedApplication.shippingOptions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Shipping Options
                          </h4>
                          <div className="space-y-1 text-sm">
                            {selectedApplication.shippingOptions.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operating Hours */}
                    {selectedApplication.operatingHours && Object.keys(selectedApplication.operatingHours).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Operating Hours
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {Object.entries(selectedApplication.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="font-medium capitalize">{day}</span>
                              <span className="text-gray-600">
                                {hours.closed ? (
                                  <span className="text-red-600">Closed</span>
                                ) : (
                                  `${hours.open} - ${hours.close}`
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Policies */}
                    {(selectedApplication.returnPolicy || selectedApplication.processingTime) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Policies</h4>
                        <div className="space-y-3 text-sm">
                          {selectedApplication.returnPolicy && (
                            <div>
                              <span className="text-gray-600 font-medium">Return Policy:</span>
                              <p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded">{selectedApplication.returnPolicy}</p>
                            </div>
                          )}
                          {selectedApplication.processingTime && (
                            <div>
                              <span className="text-gray-600 font-medium">Processing Time:</span>
                              <p className="text-gray-800 mt-1">{selectedApplication.processingTime}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Media */}
                    {selectedApplication.socialMedia && Object.values(selectedApplication.socialMedia).some(v => v) && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          Online Presence
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {selectedApplication.websiteUrl && (
                            <a
                              href={selectedApplication.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Globe className="w-4 h-4" />
                              Website
                            </a>
                          )}
                          {selectedApplication.socialMedia.facebook && (
                            <a
                              href={selectedApplication.socialMedia.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Facebook
                            </a>
                          )}
                          {selectedApplication.socialMedia.instagram && (
                            <a
                              href={selectedApplication.socialMedia.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-pink-600 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Instagram
                            </a>
                          )}
                          {selectedApplication.socialMedia.tiktok && (
                            <a
                              href={selectedApplication.socialMedia.tiktok}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-900 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              TikTok
                            </a>
                          )}
                          {selectedApplication.socialMedia.twitter && (
                            <a
                              href={selectedApplication.socialMedia.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Twitter
                            </a>
                          )}
                          {selectedApplication.socialMedia.linkedin && (
                            <a
                              href={selectedApplication.socialMedia.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-700 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => handleApproveClick(selectedApplication.id, activeTab)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading}
                    className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setPendingAction(null);
          }}
          onConfirm={handleApprove}
          title="Approve Application"
          message="Are you sure you want to approve this application? This action cannot be undone."
          confirmText="Approve"
          cancelText="Cancel"
          variant="info"
          loading={actionLoading}
        />
      </div>
    </AdminLayout>
  );
}




