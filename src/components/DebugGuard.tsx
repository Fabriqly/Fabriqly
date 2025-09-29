'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DebugGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business_owner' | 'customer';
}

export default function DebugGuard({ children, requiredRole = 'admin' }: DebugGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Only allow debug pages in development
    if (process.env.NODE_ENV !== 'development') {
      setIsAuthorized(false);
      return;
    }

    // Check authentication and role
    if (!isAuthenticated || !user) {
      setIsAuthorized(false);
      return;
    }

    // Check required role
    switch (requiredRole) {
      case 'admin':
        setIsAuthorized(user.role === 'admin');
        break;
      case 'business_owner':
        setIsAuthorized(user.role === 'admin' || user.role === 'business_owner');
        break;
      case 'customer':
        setIsAuthorized(true); // Allow all authenticated users for customer-level debug pages
        break;
      default:
        setIsAuthorized(user.role === 'admin');
    }
  }, [user, isAuthenticated, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You must be logged in to access debug pages.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Available</h1>
          <p className="text-gray-600 mb-8">Debug pages are only available in development mode.</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You need {requiredRole} privileges to access this debug page.
          </p>
          <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
