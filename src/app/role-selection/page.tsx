'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { User, Palette, Building2 } from 'lucide-react';

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

export default function RoleSelectionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(session?.user?.role || '');
  const [loading, setLoading] = useState(false);

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
    router.push('/login');
    return null;
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setLoading(true);
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
        const data = await response.json();
        console.log('Role updated successfully:', data);
        
        // CRITICAL: Force NextAuth session update
        await update({
          ...session,
          user: {
            ...session?.user,
            role: selectedRole
          }
        });

        // Small delay to ensure session is updated
        setTimeout(() => {
          // Force a hard refresh to ensure all components get the updated session
          window.location.href = '/dashboard';
        }, 500);
        
      } else {
        const errorData = await response.json();
        console.error('Role update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {session?.user?.role ? 'Update Your Role' : 'Welcome to Fabriqly!'}
          </h1>
          <p className="text-lg text-gray-600">
            {session?.user?.role 
              ? 'You can change your role at any time'
              : 'Please select your role to complete your account setup'
            }
          </p>
          {session?.user?.role && (
            <p className="text-sm text-blue-600 mt-2">
              Current role: {session.user.role.replace('_', ' ')}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roleOptions.map((role) => (
            <div
              key={role.id}
              className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all ${
                selectedRole === role.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedRole(role.id)}
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
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            loading={loading}
            className="px-8 py-3"
          >
            {session?.user?.role ? 'Update Role' : 'Continue with'} {selectedRole ? roleOptions.find(r => r.id === selectedRole)?.title : 'Role'}
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>You can change your role later in your account settings.</p>
        </div>
      </div>
    </div>
  );
}