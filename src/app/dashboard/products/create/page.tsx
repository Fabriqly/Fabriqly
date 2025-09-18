'use client';

import { ProductForm } from '@/components/products/ProductForm';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'customer' | 'designer' | 'business_owner' | 'admin';
}

function useAuth(requireAuth = false, requiredRole?: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const user = session?.user as User | undefined;
  const isLoading = status === 'loading' || isRedirecting;
  const isAuthenticated = !!session && !!user;

  useEffect(() => {
    if (!isLoading && !isRedirecting) {
      if (requireAuth && !isAuthenticated) {
        setIsRedirecting(true);
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user && user.role !== requiredRole) {
        setIsRedirecting(true);
        router.push('/unauthorized');
      }
    }
  }, [
    isLoading, 
    isAuthenticated, 
    requireAuth, 
    requiredRole, 
    user, 
    router,
    status,
    isRedirecting
  ]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isCustomer: user?.role === 'customer',
    isDesigner: user?.role === 'designer',
    isBusinessOwner: user?.role === 'business_owner',
    isAdmin: user?.role === 'admin'
  };
}

export default function AddProductPage() {
  const { user, isLoading } = useAuth(true, 'business_owner');

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductForm />
      </div>
    </div>
  );
}

