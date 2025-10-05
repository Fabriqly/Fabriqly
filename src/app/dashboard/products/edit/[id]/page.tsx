'use client';

import { use } from 'react';
import { ProductForm } from '@/components/products/ProductForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

function EditProductContent({ params }: EditProductPageProps) {
  const { id } = use(params);
  const { user, isLoading } = useAuth();

  // Check if user is a business owner or admin
  if (!isLoading && user?.role !== 'business_owner' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be a business owner or admin to edit products.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductForm productId={id} />
    </div>
  );
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <ProtectedRoute>
      <EditProductContent params={params} />
    </ProtectedRoute>
  );
}