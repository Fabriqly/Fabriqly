'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShopProfileForm from '@/components/shop/ShopProfileForm';
import { CreateShopProfileData } from '@/types/shop-profile';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CreateShopProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth(true, 'business_owner');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateShopProfileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/shop-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create shop profile');
      }

      setSuccess(true);
      
      // Redirect to shop profile dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/shop-profile');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating shop profile:', error);
      setError(error.message || 'Failed to create shop profile');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <DashboardSidebar user={user} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-800 mb-2">
                      Shop Profile Created Successfully!
                    </h2>
                    <p className="text-green-700 mb-6">
                      Your shop profile has been submitted for admin approval. You'll be redirected to your shop profile dashboard shortly.
                    </p>
                    <Button
                      onClick={() => router.push('/dashboard/shop-profile')}
                      variant="primary"
                    >
                      Go to Shop Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader user={user} />
      <div className="flex flex-1">
        <DashboardSidebar user={user} />
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/shop-profile')}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Shop Profile
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Shop Profile
                </h1>
                <p className="text-gray-600">
                  Fill in the details below to create your shop profile. Your profile will be reviewed by our admin team before going live.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Form */}
              <div className="bg-white rounded-lg shadow-md">
                <ShopProfileForm 
                  onSubmit={handleSubmit}
                  isEditing={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

