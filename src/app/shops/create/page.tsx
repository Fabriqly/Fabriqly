'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShopProfileForm from '@/components/shop/ShopProfileForm';
import { CreateShopProfileData } from '@/types/shop-profile';
import { useSession } from 'next-auth/react';

export default function CreateShopPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: CreateShopProfileData) => {
    try {
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
      
      // Redirect to shop profile after 2 seconds
      setTimeout(() => {
        router.push(`/shops/${result.data.username}`);
      }, 2000);
    } catch (error: any) {
      throw error;
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to create a shop profile.</p>
          <a
            href="/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <svg
              className="w-16 h-16 text-green-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Shop Profile Created Successfully!
            </h2>
            <p className="text-green-700">
              Your shop profile has been submitted for admin approval. You'll be redirected to your shop page shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Shop Profile</h1>
          <p className="text-gray-600">
            Fill in the details below to create your shop profile. Your profile will be reviewed by our admin team before going live.
          </p>
        </div>

        <ShopProfileForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}


