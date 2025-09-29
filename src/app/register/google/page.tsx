'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Palette, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RoleOption {
  id: 'customer' | 'designer' | 'business_owner';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Browse and purchase products from designers',
    icon: <User className="w-8 h-8" />,
    features: [
      'Browse designer portfolios',
      'Purchase custom products',
      'Track your orders',
      'Save favorite designs'
    ]
  },
  {
    id: 'designer',
    title: 'Designer',
    description: 'Create and sell your designs',
    icon: <Palette className="w-8 h-8" />,
    features: [
      'Upload your designs',
      'Set your own prices',
      'Manage your portfolio',
      'Track sales and analytics'
    ]
  },
  {
    id: 'business_owner',
    title: 'Business Owner',
    description: 'Manage your shop and team',
    icon: <Building2 className="w-8 h-8" />,
    features: [
      'Manage multiple designers',
      'View business analytics',
      'Handle customer orders',
      'Team collaboration tools'
    ]
  }
];

export default function GoogleRegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setError('Please select a role before continuing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store the selected role in sessionStorage for the summary page
      sessionStorage.setItem('googleRegistrationRole', selectedRole);
      
      // Sign in with Google
      const result = await signIn('google', { 
        callbackUrl: '/register/google/summary',
        redirect: false 
      });

      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
      } else {
        // Redirect to summary page
        router.push('/register/google/summary');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Your Registration
          </h1>
          <p className="text-lg text-gray-600">
            Choose your role to continue with Google sign-in
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md max-w-2xl mx-auto">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roleOptions.map((role) => (
            <div
              key={role.id}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                selectedRole === role.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedRole(role.id);
                setError('');
              }}
            >
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-sm">{role.description}</p>
              </div>

              <ul className="space-y-2">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleGoogleSignIn}
            disabled={!selectedRole || loading}
            loading={loading}
            className="px-8 py-3 flex items-center mx-auto"
          >
            Continue with Google
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>You can change your role later in your account settings.</p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Prefer to register with email?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Use email registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
