'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function DebugSession() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session Status:', status);
    console.log('Session Data:', session);
  }, [session, status]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>User ID:</strong> {session?.user?.id}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
        <p><strong>Role:</strong> {session?.user?.role}</p>
        <p><strong>Name:</strong> {session?.user?.name}</p>
      </div>
    </div>
  );
}
