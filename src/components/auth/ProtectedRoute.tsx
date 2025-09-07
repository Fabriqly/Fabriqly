'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'designer' | 'business_owner' | 'admin';
  requiredPermission?: string;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  loadingComponent
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access this page.
            </p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    );
  }

  // Check role authorization
  if (requiredRole && user?.role !== requiredRole) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role: {requiredRole} | Your role: {user?.role}
            </p>
          </div>
        </div>
      )
    );
  }

  // Check permission authorization
  if (requiredPermission) {
    const { hasPermission } = useRole();
    if (!hasPermission(requiredPermission)) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-4">
                You don't have the required permission to access this page.
              </p>
              <p className="text-sm text-gray-500">
                Required permission: {requiredPermission}
              </p>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function BusinessOwnerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="business_owner" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function DesignerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="designer" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function CustomerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="customer" {...props}>
      {children}
    </ProtectedRoute>
  );
}

// Import useRole in the component that needs it
function useRole() {
  const { user } = useAuth();
  
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    const permissions = {
      admin: ['*'],
      business_owner: [
        'shop:create', 'shop:read', 'shop:update', 'shop:delete',
        'product:create', 'product:read', 'product:update', 'product:delete',
        'order:read', 'order:update'
      ],
      designer: [
        'design:create', 'design:read', 'design:update', 'design:delete',
        'profile:read', 'profile:update'
      ],
      customer: [
        'product:read', 'order:create', 'order:read',
        'review:create', 'profile:read', 'profile:update'
      ]
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  return { hasPermission };
}
