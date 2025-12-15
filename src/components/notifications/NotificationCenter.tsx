'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Notification, NotificationType, NotificationCategory } from '@/types/notification';
import { NotificationItem } from './NotificationItem';
import { Loader, CheckCircle2, Filter, X } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [authError, setAuthError] = useState(false);

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
      console.error('[NotificationCenter] Firebase Auth error:', error);
      setAuthError(true);
      setFirebaseAuthReady(false);
      // Fallback to API immediately on auth error
      fetchUnreadCount();
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
            fetchUnreadCount();
            fetchNotifications();
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // For real-time updates, we'll use polling for filtered views
    // Real-time listener for unread count
    const notificationsRef = collection(db, 'notifications');
    const unreadQuery = query(
      notificationsRef,
      where('userId', '==', session.user.id),
      where('isRead', '==', false)
    );

    const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error: any) => {
      console.error('[NotificationCenter] Error listening to unread count:', error);
      // Check if it's a permission error
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        console.warn('[NotificationCenter] Permission denied, falling back to API');
        setAuthError(true);
      }
      fetchUnreadCount();
    });

    // Fetch notifications based on filters
    fetchNotifications();

    return () => {
      unsubscribeUnread();
    };
  }, [session?.user?.id, firebaseAuthReady, authError, filter, typeFilter, categoryFilter, page]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('offset', ((page - 1) * 20).toString());
      
      if (filter === 'unread') {
        params.append('isRead', 'false');
      } else if (filter === 'read') {
        params.append('isRead', 'true');
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        if (page === 1) {
          setNotifications(data.data || []);
        } else {
          setNotifications(prev => [...prev, ...(data.data || [])]);
        }
        setHasMore((data.data || []).length === 20);
      }
    } catch (error) {
      console.error('[NotificationCenter] Error fetching notifications:', error);
      if (page === 1) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

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
      console.error('[NotificationCenter] Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  // Initial fetch if Firebase Auth is not ready
  useEffect(() => {
    if (session?.user?.id && !firebaseAuthReady && !loading) {
      fetchUnreadCount();
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, firebaseAuthReady]);

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

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
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

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const clearFilters = () => {
    setFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPage(1);
  };

  if (!session?.user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Please sign in to view notifications</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Mark All as Read</span>
              <span className="sm:hidden">Mark All Read</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as any);
              setPage(1);
            }}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {(filter !== 'all' || categoryFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-gray-50 min-h-[400px]">
        {loading && page === 1 ? (
          <div className="flex items-center justify-center p-8 md:p-12">
            <Loader className="w-6 h-6 md:w-8 md:h-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 md:p-12">
            <p className="text-gray-500 text-base md:text-lg">No notifications found</p>
            <p className="text-gray-400 text-xs md:text-sm mt-2">
              {filter === 'unread' ? 'You have no unread notifications' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-2 sm:mx-4 md:mx-6 my-4 md:my-6 overflow-hidden">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
            
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

