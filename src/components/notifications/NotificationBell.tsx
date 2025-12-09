'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check Firebase Auth state
  useEffect(() => {
    if (!session?.user?.id) {
      setFirebaseAuthReady(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.uid === session.user.id) {
        setFirebaseAuthReady(true);
        setAuthError(false);
      } else if (firebaseUser === null) {
        // Firebase Auth not synced yet, but we'll try API fallback
        setFirebaseAuthReady(false);
      }
    }, (error) => {
      console.error('[NotificationBell] Firebase Auth error:', error);
      setAuthError(true);
      setFirebaseAuthReady(false);
      // Fallback to API immediately on auth error
      fetchUnreadCount();
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  // Set up Firestore listener only after Firebase Auth is ready
  useEffect(() => {
    if (!session?.user?.id || !firebaseAuthReady) {
      // If Firebase Auth not ready, use API fallback
      if (session?.user?.id && !firebaseAuthReady && !authError) {
        // Wait a bit for Firebase Auth to sync, then fallback to API
        const timeout = setTimeout(() => {
          if (!firebaseAuthReady) {
            fetchUnreadCount();
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Set up real-time listener for unread notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', session.user.id),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error: any) => {
      console.error('[NotificationBell] Error listening to notifications:', error);
      // Check if it's a permission error
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        console.warn('[NotificationBell] Permission denied, falling back to API');
        setAuthError(true);
      }
      // Fallback to API call on error
      fetchUnreadCount();
    });

    return () => unsubscribe();
  }, [session?.user?.id, firebaseAuthReady, authError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count || 0);
      }
    } catch (error) {
      console.error('[NotificationBell] Error fetching unread count:', error);
      // Set count to 0 on error to avoid showing stale data
      setUnreadCount(0);
    }
  };

  // Initial fetch if Firebase Auth is not ready
  useEffect(() => {
    if (session?.user?.id && !firebaseAuthReady) {
      fetchUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, firebaseAuthReady]);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}

