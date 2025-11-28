// hooks/useAuth.ts - ENHANCED VERSION WITH BETTER SESSION HANDLING
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { AuthErrorHandler, AuthErrorCode, AuthError } from '@/lib/auth-errors';
import { authLogger } from '@/lib/auth-logging';

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'customer' | 'designer' | 'business_owner' | 'admin' | 'pending_designer' | 'pending_shop';
}

export function useAuth(requireAuth = false, requiredRole?: string) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const user = session?.user as User | undefined;
  const isLoading = status === 'loading' || isRedirecting;
  const isAuthenticated = !!session && !!user;

  // Function to refresh user data from database
  const refreshUserData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      // Trigger session update - this will call the JWT callback
      // which will fetch fresh user data from the database
      await update();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [session?.user?.id, update]);

  useEffect(() => {
    // Handle session errors based on status
    if (status === 'unauthenticated' && requireAuth) {
      const authError = AuthErrorHandler.createError(AuthErrorCode.UNAUTHENTICATED);
      setAuthError(authError);
      
      authLogger.log({
        level: 'WARN' as any,
        message: 'Unauthenticated access attempt',
        action: 'PERMISSION_DENIED' as any,
        details: { requireAuth, requiredRole }
      });
    }

    if (!isLoading && !isRedirecting) {
      if (requireAuth && !isAuthenticated) {
        setIsRedirecting(true);
        authLogger.log({
          level: 'INFO' as any,
          message: 'Redirecting to login due to authentication requirement',
          action: 'SIGN_IN_ATTEMPT' as any,
          details: { callbackUrl: window.location.pathname }
        });
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else if (requiredRole && user && user.role !== requiredRole) {
        setIsRedirecting(true);
        authLogger.log({
          level: 'WARN' as any,
          message: `Access denied: user role ${user.role} does not match required role ${requiredRole}`,
          action: 'PERMISSION_DENIED' as any,
          userId: user.id,
          details: { userRole: user.role, requiredRole }
        });
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

  // Clear error when session changes
  useEffect(() => {
    if (session && authError) {
      setAuthError(null);
    }
  }, [session, authError]);

  // Check for role changes periodically (for pending applications that get approved)
  // OPTIMIZED: Only check for pending users, and use longer intervals to reduce load
  useEffect(() => {
    // Only check for users with pending applications - skip customers entirely
    const shouldCheck = user?.id && (
      user.role === 'pending_designer' || 
      user.role === 'pending_shop'
    );

    if (!shouldCheck) {
      return;
    }

    let isChecking = false; // Prevent concurrent checks

    const checkRoleChange = async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const dbRole = data.data?.role; // ResponseBuilder returns { success, data }
          
          // If role in database differs from session, refresh the session
          if (dbRole && dbRole !== user.role) {
            console.log(`🎉 Role changed from ${user.role} to ${dbRole}, refreshing session...`);
            
            // Clear any localStorage flags
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pendingRoleCheck');
            }
            
            await update(); // Use update directly instead of refreshUserData
            
            // Reload the page to show success messages
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error checking role change:', error);
      } finally {
        isChecking = false;
      }
    };

    // OPTIMIZED: Use longer intervals (2 minutes) to reduce server load
    // Only check when page becomes visible, not on a fixed interval
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isChecking) {
        checkRoleChange();
      }
    };

    // Check once on mount, then only on visibility change
    checkRoleChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, user?.role, update]); // Only re-run if user ID or role changes

  // Expose refresh function for components that need it
  return {
    user,
    isLoading,
    isAuthenticated,
    error: authError,
    refreshUserData,
    isCustomer: user?.role === 'customer',
    isDesigner: user?.role === 'designer',
    isBusinessOwner: user?.role === 'business_owner',
    isAdmin: user?.role === 'admin',
    isPendingDesigner: user?.role === 'pending_designer',
    isPendingShop: user?.role === 'pending_shop'
  };
}

export function useRequireAuth(requiredRole?: string) {
  return useAuth(true, requiredRole);
}

export function useRole() {
  const { user, error, refreshUserData } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!user || error) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const hasPermission = (permission: string) => {
    if (!user || error) return false;
    
    // Define role permissions with hierarchy
    const roleHierarchy = {
      admin: 4,
      business_owner: 3,
      designer: 2,
      customer: 1
    };
    
    const permissions: Record<string, string[]> = {
      admin: ['*'], // Admin has all permissions
      business_owner: [
        'shop:create', 'shop:read', 'shop:update', 'shop:delete',
        'product:create', 'product:read', 'product:update', 'product:delete',
        'order:read', 'order:update', 'analytics:read'
      ],
      designer: [
        'design:create', 'design:read', 'design:update', 'design:delete',
        'portfolio:create', 'portfolio:read', 'portfolio:update',
        'profile:read', 'profile:update'
      ],
      customer: [
        'product:read', 'order:create', 'order:read',
        'review:create', 'wishlist:create', 'wishlist:read',
        'profile:read', 'profile:update'
      ],
      pending_designer: [
        'product:read', 'order:read', 'profile:read', 'profile:update'
      ],
      pending_shop: [
        'product:read', 'order:read', 'profile:read', 'profile:update'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    // Check direct permission
    if (userPermissions.includes(permission)) return true;
    
    // Check hierarchical permissions (admins can do everything)
    if (user.role === 'admin') return true;
    
    return false;
  };

  const canAccess = (resource: string, action: 'create' | 'read' | 'update' | 'delete' = 'read') => {
    return hasPermission(`${resource}:${action}`);
  };

  return {
    user,
    hasRole,
    hasPermission,
    canAccess,
    refreshUserData,
    error
  };
}