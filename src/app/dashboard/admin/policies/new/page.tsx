'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, CheckCircle, AlertCircle, X } from 'lucide-react';
import { PolicyType } from '@/types/policy';

export default function NewPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as PolicyType | null;
  const fromParam = searchParams.get('from'); // ID of policy to copy from

  const [type, setType] = useState<PolicyType | ''>(typeParam || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (fromParam) {
      loadPolicyToCopy(fromParam);
    }
  }, [fromParam]);

  const loadPolicyToCopy = async (policyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${policyId}`);
      if (response.ok) {
        const data = await response.json();
        const policy = data.data;
        setType(policy.type);
        setTitle(policy.title);
        setContent(policy.content);
      }
    } catch (error) {
      console.error('Error loading policy to copy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!type || !title.trim() || !content.trim()) {
      setErrorMessage('Type, title, and content are required');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Policy draft created successfully!');
        setTimeout(() => {
          router.push(`/dashboard/admin/policies/${data.data.id}`);
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create policy');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      setErrorMessage('Failed to create policy');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const policyTypeLabels: Record<PolicyType, string> = {
    [PolicyType.TERMS]: 'Terms & Conditions',
    [PolicyType.PRIVACY]: 'Privacy Policy',
    [PolicyType.SHIPPING]: 'Shipping Policy',
    [PolicyType.REFUND]: 'Refund Policy'
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Create New Policy</h1>
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
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PolicyType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!!typeParam}
              >
                <option value="">Select policy type</option>
                {Object.values(PolicyType).map((t) => (
                  <option key={t} value={t}>
                    {policyTypeLabels[t]}
                  </option>
                ))}
              </select>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Content * (HTML)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={20}
                placeholder="Enter HTML content for the policy..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Note: This is a basic HTML editor. For a better editing experience, consider installing Tiptap.
                You can use HTML tags like &lt;p&gt;, &lt;h1&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || !type || !title.trim() || !content.trim()}
                loading={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

