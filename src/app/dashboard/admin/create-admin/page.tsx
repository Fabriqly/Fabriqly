'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useRequireAdmin } from '@/hooks/useAdminAuth';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function CreateAdminUserPage() {
  const { user, isLoading, isAdmin } = useRequireAdmin();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      setCreating(true);
      setMessage(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: 'admin'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin user created successfully!' });
        setFormData({
          email: '',
          password: '',
          name: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create admin user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create admin user' });
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Admin User</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new admin user account
          </p>
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
                  <AlertCircle className="h-5 w-5 text-red-400" />
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

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Admin User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• The new admin user will be able to access all admin functions</li>
            <li>• Make sure to use a strong password</li>
            <li>• The email must be unique and will be used for login</li>
            <li>• Admin users can manage categories, products, users, and system settings</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
