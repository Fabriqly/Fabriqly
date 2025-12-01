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
    if (status === 'loading') {
      console.log('[FirebaseAuthProvider] Waiting for NextAuth session...');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we have a NextAuth session but no Firebase Auth user, sync them
      if (session?.user?.id && !firebaseUser) {
        console.log('[FirebaseAuthProvider] NextAuth session found but Firebase Auth not synced, attempting sync...', {
          userId: session.user.id,
          email: session.user.email
        });
        
        try {
          // Get custom token from API
          const response = await fetch('/api/auth/firebase-token', {
            credentials: 'include',
            cache: 'no-store'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[FirebaseAuthProvider] Failed to get Firebase token:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            return;
          }

          const data = await response.json();
          
          if (data.success && data.token) {
            console.log('[FirebaseAuthProvider] Received Firebase token, signing in...');
            // Sign in with custom token
            await signInWithCustomToken(auth, data.token);
            console.log('[FirebaseAuthProvider] Successfully signed in to Firebase Auth');
          } else {
            console.warn('[FirebaseAuthProvider] Token request succeeded but no token received:', data);
          }
        } catch (error: any) {
          console.error('[FirebaseAuthProvider] Error syncing Firebase Auth:', {
            error: error.message || error,
            code: error.code,
            stack: error.stack
          });
          // API routes will still work without Firebase Auth sync
        }
      } else if (firebaseUser && session?.user?.id) {
        // Verify the Firebase user matches the NextAuth session
        if (firebaseUser.uid !== session.user.id) {
          console.warn('[FirebaseAuthProvider] Firebase Auth UID mismatch:', {
            firebaseUid: firebaseUser.uid,
            sessionUserId: session.user.id
          });
        } else {
          console.log('[FirebaseAuthProvider] Firebase Auth already synced');
        }
      }
    }, (error) => {
      console.error('[FirebaseAuthProvider] Firebase Auth state change error:', {
        error: error.message || error,
        code: error.code
      });
    });

    return () => {
      unsubscribe();
    };
  }, [session, status]);

  return <>{children}</>;
}

