'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Loader } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check Firebase Auth state
  useEffect(() => {
    if (!session?.user?.id) {
      setFirebaseAuthReady(false);
      setLoading(false);
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
      console.error('[NotificationDropdown] Firebase Auth error:', error);
      setAuthError(true);
      setFirebaseAuthReady(false);
      // Fallback to API immediately on auth error
      fetchNotifications();
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
            fetchNotifications();
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Set up real-time listener for recent unread notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', session.user.id),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
        readAt: doc.data().readAt?.toDate ? doc.data().readAt.toDate() : doc.data().readAt
      })) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.length);
      setLoading(false);
    }, (error: any) => {
      console.error('[NotificationDropdown] Error listening to notifications:', error);
      // Check if it's a permission error
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        console.warn('[NotificationDropdown] Permission denied, falling back to API');
        setAuthError(true);
      }
      setLoading(false);
      // Fallback to API call on error
      fetchNotifications();
    });

    return () => unsubscribe();
  }, [session?.user?.id, firebaseAuthReady, authError]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications?limit=10&isRead=false', {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error('[NotificationDropdown] Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Always keep dropdown data fresh via API polling when Firestore isn't usable.
  useEffect(() => {
    if (!session?.user?.id) return;

    // If Firestore is working, rely on onSnapshot.
    if (firebaseAuthReady && !authError) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, firebaseAuthReady, authError]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      const deleted = notifications.find(n => n.id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No new notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
}

