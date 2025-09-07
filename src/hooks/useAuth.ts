'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

  const user = session?.user as User | undefined;
  const isLoading = status === 'loading';
  const isAuthenticated = !!session && !!user;

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (requiredRole && user && user.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, requiredRole, user, router]);

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

export function useRole() {
  const { user } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Define role permissions
    const permissions = {
      admin: ['*'], // Admin has all permissions
      business_owner: [
        'shop:create',
        'shop:read',
        'shop:update',
        'shop:delete',
        'product:create',
        'product:read',
        'product:update',
        'product:delete',
        'order:read',
        'order:update'
      ],
      designer: [
        'design:create',
        'design:read',
        'design:update',
        'design:delete',
        'profile:read',
        'profile:update'
      ],
      customer: [
        'product:read',
        'order:create',
        'order:read',
        'review:create',
        'profile:read',
        'profile:update'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  return {
    user,
    hasRole,
    hasPermission
  };
}
