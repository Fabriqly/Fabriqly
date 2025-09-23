'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'customer' | 'designer' | 'business_owner' | 'admin';
}

export function useAuth(requireAuth = false, requiredRole?: string) {
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

export function useRequireAuth(requiredRole?: string) {
  return useAuth(true, requiredRole);
}
