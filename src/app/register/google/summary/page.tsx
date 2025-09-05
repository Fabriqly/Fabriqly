'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Mail, Briefcase, CheckCircle, ArrowLeft } from 'lucide-react';

const roleDisplayNames = {
  customer: 'Customer',
  designer: 'Designer',
  business_owner: 'Business Owner'
};

const roleDescriptions = {
  customer: 'Browse and purchase products from designers',
  designer: 'Create and sell your designs',
  business_owner: 'Manage your shop and team'
};

export default function GoogleRegistrationSummaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get the selected role from sessionStorage
    const role = sessionStorage.getItem('googleRegistrationRole');
    if (role) {
      setSelectedRole(role);
    } else {
      // If no role selected, redirect to role selection
      router.push('/register/google');
    }
  }, [router]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/register/google');
    return null;
  }

  const handleConfirmRegistration = async () => {
    if (!selectedRole || !session?.user) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      if (response.ok) {
        // Clear the role from sessionStorage
        sessionStorage.removeItem('googleRegistrationRole');
        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to complete registration');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push('/register/google');
  };

  if (!session?.user || !selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Review Your Information</h1>
            <p className="text-gray-600 mt-2">Please confirm your details before completing your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="space-y-6 mb-8">
            {/* Personal Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{session.user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{session.user.email}</p>
                </div>
                {session.user.image && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profile Picture</label>
                    <div className="mt-2">
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Type */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Account Type</h3>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p className="text-gray-900 font-medium">{roleDisplayNames[selectedRole as keyof typeof roleDisplayNames]}</p>
                <p className="text-sm text-gray-600 mt-1">{roleDescriptions[selectedRole as keyof typeof roleDescriptions]}</p>
              </div>
            </div>

            {/* Authentication Method */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sign-in Method</label>
                <p className="text-gray-900">Google Account</p>
                <p className="text-sm text-gray-600 mt-1">You'll sign in using your Google account</p>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600">By continuing, you agree to our Terms and Conditions and Privacy Policy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center justify-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Change Role
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              loading={loading}
              className="flex-1 flex items-center justify-center"
            >
              <CheckCircle size={16} className="mr-2" />
              Complete Registration
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By completing registration, you'll be able to access all features of Fabriqly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
