'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { DebugPage, debug } from '@/utils/debug';

export default function DebugSession() {
  const { data: session, status } = useSession();

  useEffect(() => {
    debug.auth(session?.user, session, status);
  }, [session, status]);

  return (
    <DebugPage title="Session Debug">
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>User ID:</strong> {session?.user?.id}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
        <p><strong>Role:</strong> {session?.user?.role}</p>
        <p><strong>Name:</strong> {session?.user?.name}</p>
      </div>
    </DebugPage>
  );
}
