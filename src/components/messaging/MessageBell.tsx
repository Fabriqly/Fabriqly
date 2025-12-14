'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle } from 'lucide-react';
import { MessageDropdown } from './MessageDropdown';

export function MessageBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/messages/unread-count', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        setUnreadCount(data?.data?.count || 0);
      }
    } catch {
      // ignore
    }
  };

  // Poll unread count (API-based, reliable even when Firebase auth isn't ready)
  // Use Page Visibility API to pause polling when tab is hidden
  useEffect(() => {
    if (!session?.user?.id) return;
    
    let isPageVisible = !document.hidden;
    
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        // Page became visible, fetch immediately and resume polling
        fetchUnreadCount();
      } else {
        // Page hidden, clear polling to save resources
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    };
    
    // Initial fetch
    fetchUnreadCount();
    
    // Poll every 30 seconds (instead of 5 seconds) when page is visible
    const startPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (isPageVisible) {
        pollingRef.current = setInterval(() => {
          if (isPageVisible) {
            fetchUnreadCount();
          }
        }, 30000); // 30 seconds instead of 5 seconds
      }
    };
    
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Close on outside click
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

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Messages"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <MessageDropdown
          onClose={() => {
            setIsOpen(false);
            // Refresh count after closing (in case user opened a conversation)
            fetchUnreadCount();
          }}
        />
      )}
    </div>
  );
}
