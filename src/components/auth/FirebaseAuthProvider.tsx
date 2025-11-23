'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

/**
 * Provider that syncs Firebase Auth with NextAuth session
 * This ensures Firestore security rules work for client-side queries
 */
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we have a NextAuth session but no Firebase Auth user, sync them
      if (session?.user?.id && !firebaseUser) {
        try {
          // Get custom token from API
          const response = await fetch('/api/auth/firebase-token');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
              // Sign in with custom token
              await signInWithCustomToken(auth, data.token);
            }
          }
        } catch (error) {
          // Silently fail - API routes will still work
          // Silently fail - API routes will still work
        }
      }
    });

    return () => unsubscribe();
  }, [session, status]);

  return <>{children}</>;
}

