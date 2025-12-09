'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, Mail, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
      } else {
        setResendMessage({ type: 'error', text: data.error || 'Failed to send verification email. Please try again.' });
      }
    } catch (error) {
      setResendMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setResending(false);
    }
  };

  const getErrorMessage = () => {
    switch (error) {
      case 'missing_token':
        return {
          title: 'Missing Verification Token',
          message: 'The verification link is incomplete. Please check your email and click the full link.',
        };
      case 'invalid_token':
        return {
          title: 'Invalid Verification Link',
          message: 'This verification link is invalid or has already been used. Please request a new verification email.',
        };
      case 'expired_token':
        return {
          title: 'Verification Link Expired',
          message: 'This verification link has expired. Verification links are valid for 24 hours. Please request a new verification email.',
        };
      default:
        return {
          title: 'Verification Error',
          message: 'An error occurred while verifying your email. Please try again or request a new verification email.',
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {resendMessage && (
          <div className={`mb-4 p-3 rounded ${
            resendMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {resendMessage.text}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Link href="/explore" className="block">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Need help?</p>
          <Link href="/support" className="text-sm text-blue-600 hover:text-blue-700">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

