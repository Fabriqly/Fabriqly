'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Mail, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

export default function VerifyEmailSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();
  const verified = searchParams.get('verified') === 'true';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Refresh session to update isVerified status
    if (verified && session) {
      update();
    }
  }, [verified, session, update]);

  useEffect(() => {
    // Auto-redirect to explore page after 5 seconds
    if (verified) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/explore');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verified, router]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Mail className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification</h1>
          <p className="text-gray-600 mb-6">
            Please check your email and click the verification link to verify your email address.
          </p>
          <Link href="/explore">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Email Verified Successfully!
        </h1>
        
        <p className="text-gray-600 mb-2">
          Your email address has been verified. You can now receive important notifications about your orders and account.
        </p>
        
        {verified && countdown > 0 && (
          <p className="text-sm text-blue-600 mb-6">
            Redirecting to explore page in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        )}

        <div className="space-y-3">
          <Link href="/explore" className="block">
            <Button className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Explore
            </Button>
          </Link>
          
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

