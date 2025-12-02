'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmailVerificationBanner() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is verified
  const isVerified = session?.user?.isVerified ?? true; // Default to true if not set

  // Don't show if verified or dismissed
  if (isVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send verification email. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Verify Your Email Address
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please verify your email address to receive important notifications about your orders and account.
                </p>
                {message && (
                  <div className={`mt-2 p-2 rounded ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-4 flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleResendVerification}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

