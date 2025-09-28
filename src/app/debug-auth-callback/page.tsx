'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DebugPage, debug } from '@/utils/debug';

export default function DebugAuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    debug.auth(session?.user, session, status);
    debug.navigation('auth-callback', 'role-selection', { status });
    
    if (status === 'authenticated') {
      debug.userAction('redirect-to-role-selection');
      router.push('/role-selection');
    }
  }, [status, session, router]);

  return (
    <DebugPage title="Authentication Debug">
      <div className="text-center">
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
    </DebugPage>
  );
}
