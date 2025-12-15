'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Eye, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Policy, PolicyStatus } from '@/types/policy';

export default function PolicyEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadPolicy();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${id}`);
      if (response.ok) {
        const data = await response.json();
        const loadedPolicy = data.data;
        setPolicy(loadedPolicy);
        setTitle(loadedPolicy.title);
        setContent(loadedPolicy.content);
      } else {
        setErrorMessage('Failed to load policy');
        setTimeout(() => {
          router.push('/dashboard/admin/policies');
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading policy:', error);
      setErrorMessage('Failed to load policy');
      setTimeout(() => {
        router.push('/dashboard/admin/policies');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Title and content are required');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setSaving(true);
      const url = id === 'new' ? '/api/policies' : `/api/policies/${id}`;
      const method = id === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: policy?.type || new URLSearchParams(window.location.search).get('type'),
          title,
          content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Policy saved successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
        if (id === 'new') {
          router.push(`/dashboard/admin/policies/${data.data.id}`);
        } else {
          await loadPolicy();
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save policy');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      setErrorMessage('Failed to save policy');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    if (!policy || policy.status !== PolicyStatus.DRAFT) {
      setErrorMessage('Only draft policies can be published');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPublish = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/policies/${policy.id}/publish`, {
        method: 'POST'
      });

      if (response.ok) {
        setSuccessMessage('Policy published successfully!');
        setShowConfirmModal(false);
        setTimeout(() => setSuccessMessage(null), 5000);
        await loadPolicy();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to publish policy');
        setShowConfirmModal(false);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error publishing policy:', error);
      setErrorMessage('Failed to publish policy');
      setShowConfirmModal(false);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading policy...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/admin/policies')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {id === 'new' ? 'Create New Policy' : 'Edit Policy'}
          </h1>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter policy title"
              />
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Policy Content * (HTML)
                </label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>

              {showPreview ? (
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[400px]">
                  <div 
                    className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={20}
                  placeholder="Enter HTML content for the policy..."
                />
              )}

              <p className="text-xs text-gray-500 mt-2">
                Note: This is a basic HTML editor. For a better editing experience, consider installing Tiptap.
                You can use HTML tags like &lt;p&gt;, &lt;h1&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            {/* Status info */}
            {policy && (
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {policy.status} | <strong>Version:</strong> {policy.version} | 
                  <strong> Type:</strong> {policy.type}
                </p>
                {policy.status === PolicyStatus.PUBLISHED && (
                  <p className="text-sm text-yellow-600 mt-2">
                    ⚠️ This policy is published and cannot be edited. Create a new draft to make changes.
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || (policy?.status === PolicyStatus.PUBLISHED)}
                loading={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {id === 'new' ? 'Create Draft' : 'Save Changes'}
              </Button>

              {policy && policy.status === PolicyStatus.DRAFT && (
                <Button
                  onClick={handlePublish}
                  disabled={saving}
                  loading={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Publish Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Publish Policy</h3>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to publish this policy? This will archive the current published version.
              </p>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublish}
                  disabled={saving}
                  loading={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Publish
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

