'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Mail, Lock, Briefcase, CheckCircle, ArrowLeft } from 'lucide-react';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'designer' | 'business_owner';
  agreeToTerms: boolean;
}

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

export default function RegistrationSummaryPage() {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get registration data from sessionStorage
    const data = sessionStorage.getItem('registrationData');
    if (data) {
      setRegistrationData(JSON.parse(data));
    } else {
      // If no data, redirect to registration
      router.push('/register');
    }
  }, [router]);

  const handleConfirmRegistration = async () => {
    if (!registrationData) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          password: registrationData.password,
          role: registrationData.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        
        // Clear the registration data from sessionStorage
        sessionStorage.removeItem('registrationData');
        
        // Redirect to login page with success message
        router.push('/login?message=Registration successful. Please sign in.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
        setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push('/register');
  };

  if (!registrationData) {
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
            <p className="text-gray-600 mt-2">Please confirm your details before creating your account</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{registrationData.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{registrationData.lastName}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{registrationData.email}</p>
                </div>
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
                <p className="text-gray-900 font-medium">{roleDisplayNames[registrationData.role]}</p>
                <p className="text-sm text-gray-600 mt-1">{roleDescriptions[registrationData.role]}</p>
              </div>
            </div>

            {/* Security Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Lock className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Security</h3>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Password</label>
                <p className="text-gray-900">••••••••</p>
                <p className="text-sm text-gray-600 mt-1">Your password is secure and encrypted</p>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
                  <p className="text-sm text-gray-600">You have agreed to our Terms and Conditions and Privacy Policy</p>
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
              Edit Information
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              loading={loading}
              className="flex-1 flex items-center justify-center"
            >
              <CheckCircle size={16} className="mr-2" />
              Create My Account
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By creating an account, you'll be able to access all features of Fabriqly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
