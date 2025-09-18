'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Settings, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  Shield,
  Database
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'Fabriqly',
    siteDescription: 'Custom Design Marketplace',
    siteUrl: 'https://fabriqly.com',
    contactEmail: 'admin@fabriqly.com',
    supportEmail: 'support@fabriqly.com',
    maxFileSize: '10',
    allowedFileTypes: 'jpg,jpeg,png,gif,webp',
    enableRegistration: true,
    requireEmailVerification: true,
    enableAnalytics: true,
    maintenanceMode: false,
    maxProductsPerUser: '100',
    maxImagesPerProduct: '10'
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const settingSections = [
    {
      title: 'General Settings',
      icon: Globe,
      fields: [
        {
          key: 'siteName',
          label: 'Site Name',
          type: 'text',
          description: 'The name of your marketplace'
        },
        {
          key: 'siteDescription',
          label: 'Site Description',
          type: 'textarea',
          description: 'Brief description of your marketplace'
        },
        {
          key: 'siteUrl',
          label: 'Site URL',
          type: 'text',
          description: 'The main URL of your marketplace'
        }
      ]
    },
    {
      title: 'Email Settings',
      icon: Mail,
      fields: [
        {
          key: 'contactEmail',
          label: 'Contact Email',
          type: 'email',
          description: 'Email address for general inquiries'
        },
        {
          key: 'supportEmail',
          label: 'Support Email',
          type: 'email',
          description: 'Email address for customer support'
        }
      ]
    },
    {
      title: 'File Upload Settings',
      icon: Database,
      fields: [
        {
          key: 'maxFileSize',
          label: 'Max File Size (MB)',
          type: 'number',
          description: 'Maximum file size for uploads'
        },
        {
          key: 'allowedFileTypes',
          label: 'Allowed File Types',
          type: 'text',
          description: 'Comma-separated list of allowed file extensions'
        },
        {
          key: 'maxImagesPerProduct',
          label: 'Max Images Per Product',
          type: 'number',
          description: 'Maximum number of images per product'
        }
      ]
    },
    {
      title: 'User Settings',
      icon: Shield,
      fields: [
        {
          key: 'maxProductsPerUser',
          label: 'Max Products Per User',
          type: 'number',
          description: 'Maximum products a user can create'
        },
        {
          key: 'enableRegistration',
          label: 'Enable Registration',
          type: 'checkbox',
          description: 'Allow new users to register'
        },
        {
          key: 'requireEmailVerification',
          label: 'Require Email Verification',
          type: 'checkbox',
          description: 'Require email verification for new accounts'
        }
      ]
    },
    {
      title: 'System Settings',
      icon: Settings,
      fields: [
        {
          key: 'enableAnalytics',
          label: 'Enable Analytics',
          type: 'checkbox',
          description: 'Enable analytics tracking'
        },
        {
          key: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox',
          description: 'Put the site in maintenance mode'
        }
      ]
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure platform settings and preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <div key={sectionIndex} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center mb-4">
                    <Icon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex}>
                        {field.type === 'checkbox' ? (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings[field.key as keyof typeof settings] as boolean}
                              onChange={(e) => handleInputChange(field.key, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <label className="text-sm font-medium text-gray-700">
                                {field.label}
                              </label>
                              <p className="text-sm text-gray-500">
                                {field.description}
                              </p>
                            </div>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            <textarea
                              value={settings[field.key as keyof typeof settings] as string}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              {field.description}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Input
                              label={field.label}
                              type={field.type}
                              value={settings[field.key as keyof typeof settings] as string}
                              onChange={(e) => handleInputChange(field.key, e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              {field.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg border border-red-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-lg font-medium text-red-900">
                Danger Zone
              </h3>
            </div>
            <p className="text-sm text-red-600 mb-4">
              These actions are irreversible. Please be careful.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
                    alert('Analytics data cleared (simulated)');
                  }
                }}
              >
                Clear Analytics Data
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
                    alert('Settings reset to default (simulated)');
                  }
                }}
              >
                Reset to Default Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
