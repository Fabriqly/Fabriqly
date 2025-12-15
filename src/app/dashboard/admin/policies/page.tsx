'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Plus, Edit, Eye, Archive, CheckCircle, Clock, XCircle, ExternalLink, AlertCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Policy, PolicyType, PolicyStatus } from '@/types/policy';

export default function AdminPoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<PolicyType | 'all'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'publish' | 'archive'; id: string } | null>(null);

  useEffect(() => {
    loadPolicies();
  }, [selectedType]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const url = selectedType === 'all' 
        ? '/api/policies'
        : `/api/policies?type=${selectedType}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || []);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = (type: PolicyType) => {
    router.push(`/dashboard/admin/policies/new?type=${type}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/admin/policies/${id}`);
  };

  const handlePublish = (id: string) => {
    setPendingAction({ type: 'publish', id });
    setShowConfirmModal(true);
  };

  const handleArchive = (id: string) => {
    setPendingAction({ type: 'archive', id });
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    try {
      const endpoint = pendingAction.type === 'publish' 
        ? `/api/policies/${pendingAction.id}/publish`
        : `/api/policies/${pendingAction.id}/archive`;
      
      const response = await fetch(endpoint, {
        method: 'POST'
      });

      if (response.ok) {
        await loadPolicies();
        setSuccessMessage(
          pendingAction.type === 'publish' 
            ? 'Policy published successfully!'
            : 'Policy archived successfully!'
        );
        setShowConfirmModal(false);
        setPendingAction(null);
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || `Failed to ${pendingAction.type} policy`);
        setShowConfirmModal(false);
        setPendingAction(null);
        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error(`Error ${pendingAction.type}ing policy:`, error);
      setErrorMessage(`Failed to ${pendingAction.type} policy`);
      setShowConfirmModal(false);
      setPendingAction(null);
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const getStatusIcon = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.PUBLISHED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case PolicyStatus.DRAFT:
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case PolicyStatus.ARCHIVED:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PolicyStatus) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case PolicyStatus.PUBLISHED:
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Published</span>;
      case PolicyStatus.DRAFT:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Draft</span>;
      case PolicyStatus.ARCHIVED:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Archived</span>;
    }
  };

  // Group policies by type
  const policiesByType = policies.reduce((acc, policy) => {
    if (!acc[policy.type]) {
      acc[policy.type] = [];
    }
    acc[policy.type].push(policy);
    return acc;
  }, {} as Record<PolicyType, Policy[]>);

  const policyTypeLabels: Record<PolicyType, string> = {
    [PolicyType.TERMS]: 'Terms & Conditions',
    [PolicyType.PRIVACY]: 'Privacy Policy',
    [PolicyType.SHIPPING]: 'Shipping Policy',
    [PolicyType.REFUND]: 'Refund Policy'
  };

  const policyPaths: Record<PolicyType, string> = {
    [PolicyType.TERMS]: '/terms-and-conditions',
    [PolicyType.PRIVACY]: '/privacy-policy',
    [PolicyType.SHIPPING]: '/shipping-policy',
    [PolicyType.REFUND]: '/refund-policy'
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Policy Management</h1>
            <p className="text-gray-600 mt-1">Manage Terms & Conditions, Privacy Policy, Shipping Policy, and Refund Policy</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-600 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-3 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-3 text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter by type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Policies
            </button>
            {Object.values(PolicyType).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {policyTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading policies...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(policiesByType).map(([type, typePolicies]) => (
              <div key={type} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {policyTypeLabels[type as PolicyType]}
                    </h2>
                    <a
                      href={policyPaths[type as PolicyType]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Public Page
                    </a>
                  </div>
                  <Button
                    onClick={() => handleCreateNew(type as PolicyType)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New
                  </Button>
                </div>

                <div className="divide-y divide-gray-200">
                  {typePolicies.map((policy) => (
                    <div key={policy.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{policy.title}</h3>
                            {getStatusIcon(policy.status)}
                            {getStatusBadge(policy.status)}
                            <span className="text-sm text-gray-500">v{policy.version}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Last updated: {new Date(policy.updatedAt).toLocaleDateString()} by {policy.lastUpdatedBy}
                          </p>
                          <div className="flex gap-2">
                            {policy.status === PolicyStatus.DRAFT && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(policy.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePublish(policy.id)}
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Publish
                                </Button>
                              </>
                            )}
                            {policy.status === PolicyStatus.PUBLISHED && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Create draft from published
                                  router.push(`/dashboard/admin/policies/new?type=${policy.type}&from=${policy.id}`);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Create Draft
                              </Button>
                            )}
                            {policy.status !== PolicyStatus.ARCHIVED && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleArchive(policy.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <Archive className="w-4 h-4" />
                                Archive
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(policy.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {typePolicies.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No policies found. Create your first policy version.</p>
                  </div>
                )}
              </div>
            ))}

            {Object.keys(policiesByType).length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No policies found.</p>
                <Button onClick={() => handleCreateNew(PolicyType.TERMS)}>
                  Create First Policy
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && pendingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {pendingAction.type === 'publish' ? 'Publish Policy' : 'Archive Policy'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {pendingAction.type === 'publish' 
                  ? 'Are you sure you want to publish this policy? This will archive the current published version.'
                  : 'Are you sure you want to archive this policy?'}
              </p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAction}
                  className={pendingAction.type === 'publish' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'}
                >
                  Confirm {pendingAction.type === 'publish' ? 'Publish' : 'Archive'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

