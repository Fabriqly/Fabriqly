// components/auth/AuthErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { signOut } from 'next-auth/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to your error reporting service
    console.error('Authentication Error:', error, errorInfo);
    
    // If it's an auth-related error, sign out the user
    if (this.isAuthError(error)) {
      signOut({ callbackUrl: '/login' });
    }
  }

  private isAuthError(error: Error): boolean {
    const authErrorMessages = [
      'token',
      'session',
      'authentication',
      'unauthorized',
      'expired',
      'invalid_grant'
    ];
    
    return authErrorMessages.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an issue with your session. Please sign in again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                signOut({ callbackUrl: '/login' });
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useAuthErrorBoundary() {
  const handleAuthError = (error: Error) => {
    console.error('Authentication error:', error);
    
    // Check if it's an auth error
    const authErrorKeywords = ['token', 'session', 'authentication', 'unauthorized'];
    const isAuthError = authErrorKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
    
    if (isAuthError) {
      signOut({ callbackUrl: '/login' });
    }
  };

  return { handleAuthError };
}