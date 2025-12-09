'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShopApplicationForm } from '@/components/applications/ShopApplicationForm';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';

export default function ApplyShopPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/apply/shop');
    }
    
    // Redirect if user is not a customer or pending_shop
    if (!isLoading && user && user.role !== 'customer' && user.role !== 'pending_shop') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      <div className="container mx-auto px-4 py-8">
        <ShopApplicationForm onCancel={() => router.back()} />
      </div>
      
      <ScrollToTop />
    </div>
  );
}




