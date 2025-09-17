'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdminAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAdmin: session?.user?.role === 'admin'
  };
}

export function useRequireAdmin() {
  const { user, isLoading, isAdmin } = useAdminAuth();

  if (isLoading) {
    return {
      user: null,
      isLoading: true,
      isAdmin: false
    };
  }

  if (!isAdmin) {
    return {
      user: null,
      isLoading: false,
      isAdmin: false
    };
  }

  return {
    user,
    isLoading: false,
    isAdmin: true
  };
}
