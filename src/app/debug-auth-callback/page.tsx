'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugAuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Debug Auth Callback - Status:', status);
    console.log('Debug Auth Callback - Session:', session);
    
    if (status === 'authenticated') {
      console.log('Redirecting to role selection...');
      router.push('/role-selection');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
        <div className="space-y-2">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>User:</strong> {session?.user?.email || 'None'}</p>
          <p><strong>Role:</strong> {session?.user?.role || 'None'}</p>
        </div>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Processing...</p>
        </div>
      </div>
    </div>
  );
}
