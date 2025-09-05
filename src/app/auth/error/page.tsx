'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        if (error?.includes('email-already-in-use')) {
          return 'This email is already registered with a different sign-in method. Please use the original sign-in method or a different email.';
        }
        return 'Access was denied. Please check your Google OAuth configuration.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Error:</strong> {error}</p>
              <p className="mt-2">
                If you're seeing this error, you might want to:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Try signing in with your original registration method</li>
                <li>Use a different email address</li>
                <li>Reset your password if you forgot it</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Link href="/login">
                <Button variant="outline" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              <Link href="/register">
                <Button>
                  Try Registration
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Check the{' '}
            <Link href="/debug-firebase" className="text-blue-600 hover:underline">
              debug page
            </Link>
            {' '}for more information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
