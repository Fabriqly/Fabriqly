'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, MessageSquare, Moon, Sun, Save, Loader } from 'lucide-react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';

interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark';
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    theme: 'light'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPreferences();
    }
  }, [status]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile');
      const data = await response.json();

      if (response.ok && data.success) {
        const userPrefs = data.data.profile?.preferences;
        if (userPrefs) {
          setPreferences({
            notifications: {
              email: userPrefs.notifications?.email ?? true,
              sms: userPrefs.notifications?.sms ?? false,
              push: userPrefs.notifications?.push ?? true
            },
            theme: userPrefs.theme || 'light'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (category: 'notifications' | 'theme', key: string, value: boolean | string) => {
    if (category === 'notifications') {
      setPreferences(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value
        }
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Preferences saved successfully!');
        // Refresh after a moment
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isDesigner = session?.user?.role === 'designer' || session?.user?.role === 'business_owner';

  // For designers/business owners, use dashboard layout
  if (isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={session?.user || null} showMobileMenu={true} />
        <div className="flex flex-1">
          <DashboardSidebar user={session?.user || null} />
          <div className="flex-1 p-6">
            <SettingsContent
              preferences={preferences}
              onPreferenceChange={handlePreferenceChange}
              onSave={handleSave}
              saving={saving}
              error={error}
              success={success}
            />
          </div>
        </div>
      </div>
    );
  }

  // For customers, use customer header with floating sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      <div className="flex gap-8 p-8">
        {/* Left Sidebar - Floating Navigation Card */}
        <CustomerNavigationSidebar />

        {/* Right Content Area */}
        <main className="flex-1">
          <div className="max-w-4xl">
            <SettingsContent
              preferences={preferences}
              onPreferenceChange={handlePreferenceChange}
              onSave={handleSave}
              saving={saving}
              error={error}
              success={success}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

interface SettingsContentProps {
  preferences: UserPreferences;
  onPreferenceChange: (category: 'notifications' | 'theme', key: string, value: boolean | string) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  success: string | null;
}

function SettingsContent({
  preferences,
  onPreferenceChange,
  onSave,
  saving,
  error,
  success
}: SettingsContentProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and notification settings</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notification Preferences
        </h2>
        
        <div className="space-y-4">
          {/* In-App Notifications (Push) */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    In-App Notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive notifications in the app (bell icon). This controls whether notifications are created for you.
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => onPreferenceChange('notifications', 'push', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    Email Notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive notifications via email (coming soon)
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => onPreferenceChange('notifications', 'email', e.target.checked)}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer opacity-50 cursor-not-allowed"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-3 text-gray-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    SMS Notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Receive notifications via SMS (coming soon)
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications.sms}
                onChange={(e) => onPreferenceChange('notifications', 'sms', e.target.checked)}
                disabled
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer opacity-50 cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Theme Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          {preferences.theme === 'dark' ? (
            <Moon className="w-5 h-5 mr-2" />
          ) : (
            <Sun className="w-5 h-5 mr-2" />
          )}
          Theme Preferences
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center">
                {preferences.theme === 'dark' ? (
                  <Moon className="w-5 h-5 mr-3 text-gray-600" />
                ) : (
                  <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                )}
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    {preferences.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose your preferred theme (coming soon)
                  </p>
                </div>
              </div>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => onPreferenceChange('theme', 'theme', e.target.value)}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          loading={saving}
          className="px-8 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </>
  );
}

