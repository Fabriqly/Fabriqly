'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

/**
 * Hook to sync Firebase Auth with NextAuth session
 * This ensures Firestore security rules work properly
 */
export function useFirebaseAuth() {
  const { data: session, status } = useSession();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    // Check if user is already signed in to Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);

      // If NextAuth session exists but Firebase Auth doesn't, get custom token
      if (session?.user?.id && !user) {
        syncFirebaseAuth();
      }
    });

    return () => unsubscribe();
  }, [session, status]);

  const syncFirebaseAuth = async () => {
    if (!session?.user?.id) return;

    try {
      // Get custom token from API
      const response = await fetch('/api/auth/firebase-token');
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          // Sign in with custom token
          await signInWithCustomToken(auth, data.token);
        }
      }
    } catch (error) {
      console.error('Error syncing Firebase Auth:', error);
      // If custom token fails, we'll rely on API routes for Firestore access
    }
  };

  return { firebaseUser, loading };
}

