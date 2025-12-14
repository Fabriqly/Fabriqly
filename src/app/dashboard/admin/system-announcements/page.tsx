'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bell, Send, Users, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function SystemAnnouncementsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [specificUserIds, setSpecificUserIds] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    actionUrl: '',
    actionLabel: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendAnnouncement = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/system-announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          priority: formData.priority,
          actionUrl: formData.actionUrl || undefined,
          actionLabel: formData.actionLabel || undefined,
          recipientType,
          userIds: recipientType === 'specific' 
            ? specificUserIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
            : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement');
      }

      setSuccess(`Announcement sent successfully! ${data.data.sentCount} notification(s) created.`);
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        actionUrl: '',
        actionLabel: ''
      });
      setSpecificUserIds('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Bell className="w-6 h-6 mr-2 text-blue-600" />
              System Announcements
            </h1>
            <p className="text-gray-600">
              Send system-wide announcements to all users or specific users
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Success</p>
                <p className="text-sm text-green-600 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Announcement Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Create Announcement</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., New Feature Available!"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the announcement message..."
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Action URL (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action URL (Optional)
                </label>
                <Input
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleInputChange}
                  placeholder="e.g., /explore, /products/123"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL to redirect users when they click the notification
                </p>
              </div>

              {/* Action Label (Optional) */}
              {formData.actionUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Button Label (Optional)
                  </label>
                  <Input
                    name="actionLabel"
                    value={formData.actionLabel}
                    onChange={handleInputChange}
                    placeholder="e.g., View Now, Learn More"
                  />
                </div>
              )}

              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Recipients
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="recipientType"
                      value="all"
                      checked={recipientType === 'all'}
                      onChange={(e) => setRecipientType(e.target.value as 'all' | 'specific')}
                      className="mr-3"
                    />
                    <Users className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">All Users</p>
                      <p className="text-sm text-gray-500">Send to all users in the system</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="recipientType"
                      value="specific"
                      checked={recipientType === 'specific'}
                      onChange={(e) => setRecipientType(e.target.value as 'all' | 'specific')}
                      className="mr-3"
                    />
                    <User className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Specific Users</p>
                      <p className="text-sm text-gray-500">Send to specific user IDs or emails (comma-separated)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Specific User IDs */}
              {recipientType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User IDs or Emails <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={specificUserIds}
                    onChange={(e) => setSpecificUserIds(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter user IDs or emails, separated by commas&#10;e.g., user123, user456, customer1@fabriqly.com"
                    required={recipientType === 'specific'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple users with commas. You can use user IDs or email addresses.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSendAnnouncement}
                  loading={saving}
                  disabled={saving || !formData.title.trim() || !formData.message.trim()}
                  className="px-6 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {saving ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Announcements are sent as in-app notifications (bell icon)</li>
              <li>Users will see the notification in real-time</li>
              <li>Notifications respect user preferences (if push is disabled, they won't receive it)</li>
              <li>You can send to all users or specific users by ID or email</li>
              <li>Action URL is optional - if provided, users can click to navigate</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

