'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { NotificationType } from '@/types/notification';

export default function TestNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<NotificationType>('system_announcement');
  const [count, setCount] = useState(1);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(false);

  const notificationTypes: NotificationType[] = [
    'order_created',
    'order_status_changed',
    'order_cancelled',
    'order_payment_received',
    'order_payment_failed',
    'customization_request_created',
    'customization_designer_assigned',
    'customization_design_completed',
    'customization_design_approved',
    'customization_design_rejected',
    'customization_pricing_created',
    'customization_payment_required',
    'customization_request_cancelled',
    'message_received',
    'review_received',
    'review_reply_received',
    'product_published',
    'product_updated',
    'user_welcome',
    'user_verified',
    'application_status_updated',
    'profile_updated',
    'system_announcement'
  ];

  const handleCreateTestNotification = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/test/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          count,
          userId: targetUserId || undefined,
          bypassPreferences: true // Always bypass for testing
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      setResult(data);
      
      // Refresh unread count after a moment
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/test/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          allTypes: true,
          userId: targetUserId || undefined,
          bypassPreferences: true // Always bypass for testing
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notifications');
      }

      setResult(data);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckHandlers = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/test/notifications/check-handlers');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check handlers');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUser = async () => {
    if (!targetUserId.trim()) {
      setError('Please enter a user ID or email');
      return;
    }

    try {
      setCheckingUser(true);
      setError(null);
      setUserInfo(null);

      // Check if it's an email or user ID
      const isEmail = targetUserId.includes('@');
      const queryParam = isEmail ? `email=${encodeURIComponent(targetUserId)}` : `userId=${encodeURIComponent(targetUserId)}`;
      const response = await fetch(`/api/test/notifications/check-user?${queryParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check user');
      }

      setUserInfo(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleDebug = async () => {
    if (!targetUserId.trim()) {
      setError('Please enter a user ID or email');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Check if it's an email or user ID
      const isEmail = targetUserId.includes('@');
      const queryParam = isEmail ? `email=${encodeURIComponent(targetUserId)}` : `userId=${encodeURIComponent(targetUserId)}`;
      const response = await fetch(`/api/test/notifications/debug?${queryParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to debug');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Notification System</h1>

          {/* Check Handlers */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Event Handlers Status</h2>
            <button
              onClick={handleCheckHandlers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Check Event Handlers
            </button>
            {result && result.data?.handlersInitialized && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">✅ Event handlers are initialized</p>
              </div>
            )}
          </div>

          {/* Check User Preferences */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Check User Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID or Email (leave empty to use current user)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter user ID or email (e.g., customer1@fabriqly.com)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCheckUser}
                      disabled={checkingUser}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {checkingUser ? 'Checking...' : 'Check User'}
                    </button>
                    <button
                      onClick={handleDebug}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Debugging...' : 'Debug Notifications'}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Use this to check if a customer user has notifications enabled. If push is false, notifications won't be created.
                </p>
              </div>
              {userInfo && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">User Info:</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Email:</strong> {userInfo.email}</p>
                    <p><strong>Name:</strong> {userInfo.displayName || 'N/A'}</p>
                    <p><strong>Role:</strong> {userInfo.role}</p>
                    <p><strong>Push Enabled:</strong> {userInfo.preferences?.pushEnabled ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Push Setting:</strong> {userInfo.preferences?.push !== undefined ? String(userInfo.preferences.push) : 'Not set (defaults to true)'}</p>
                    <p><strong>Preferences Path:</strong> {userInfo.preferencesPath || 'Not set'}</p>
                  </div>
                </div>
              )}
              
              {result && result.data && result.data.testResult && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Debug Result:</h3>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p><strong>Test Notification:</strong> {result.data.testResult.success ? '✅ Created' : '❌ Failed'}</p>
                    {result.data.testResult.success && (
                      <>
                        <p><strong>Notification ID:</strong> {result.data.testResult.notificationId}</p>
                        <p><strong>Title:</strong> {result.data.testResult.title}</p>
                      </>
                    )}
                    {result.data.testResult.error && (
                      <p><strong>Error:</strong> {result.data.testResult.error}</p>
                    )}
                    <p><strong>Unread Count:</strong> {result.data.notifications?.unreadCount || 0}</p>
                    <p><strong>Recent Notifications:</strong> {result.data.notifications?.recent?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Test Notification */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Test Notification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {notificationTypes.map(nt => (
                    <option key={nt} value={nt}>{nt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateTestNotification}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Notification'}
                </button>
                <button
                  onClick={handleCreateAllTypes}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create All Types'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">❌ Error: {error}</p>
            </div>
          )}

          {result && result.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>Created: {result.data?.created || 0} notification(s)</p>
                {result.data?.failed > 0 && (
                  <p>Failed: {result.data.failed} notification(s)</p>
                )}
                <p className="mt-2">Check the notification bell icon (🔔) in the header!</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Testing Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Click "Create Notification" above</li>
              <li>Look at the notification bell icon (🔔) in the header</li>
              <li>Badge should show the unread count</li>
              <li>Click the bell to see notifications</li>
              <li>Click a notification to mark it as read</li>
              <li>Badge count should update in real-time</li>
            </ol>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Note:</strong> Notifications update in real-time. You don't need to refresh the page!
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

