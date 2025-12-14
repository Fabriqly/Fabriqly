'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2, MessageCircle, User as UserIcon } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatTimestamp';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string | null;
  lastMessageAt?: any;
  unreadCount?: Record<string, number> | number;
  metadata?: {
    shopId?: string;
    type?: string;
  };
}

interface EnrichedConversation extends Conversation {
  otherUser?: {
    id: string;
    name: string;
    photoURL?: string;
    role?: string;
  };
  unreadForMe: number;
}

interface MessageDropdownProps {
  onClose?: () => void;
}

export function MessageDropdown({ onClose }: MessageDropdownProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const userId = session?.user?.id || null;
  const isCustomer = session?.user?.role === 'customer';
  const baseMessagesRoute = isCustomer ? '/messages' : '/dashboard/messages';

  const fetchConversations = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/messages', { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => null);
      const list: Conversation[] = json?.data || [];

      // Sort by lastMessageAt (best-effort)
      const sorted = [...list].sort((a, b) => {
        const aDate = new Date(
          (a.lastMessageAt?.toDate && a.lastMessageAt.toDate()) ||
            (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : a.lastMessageAt) ||
            0
        ).getTime();
        const bDate = new Date(
          (b.lastMessageAt?.toDate && b.lastMessageAt.toDate()) ||
            (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : b.lastMessageAt) ||
            0
        ).getTime();
        return bDate - aDate;
      });

      const top = sorted.slice(0, 10);

      // Enrich with other user details (best-effort)
      const enriched: EnrichedConversation[] = await Promise.all(
        top.map(async (c) => {
          const unreadForMe =
            typeof c.unreadCount === 'number'
              ? c.unreadCount
              : (c.unreadCount && typeof c.unreadCount === 'object' && typeof c.unreadCount[userId] === 'number')
                ? (c.unreadCount[userId] as number)
                : 0;

          const otherUserId = c.participants?.find(p => p !== userId);
          if (!otherUserId) return { ...c, unreadForMe };

          try {
            const uRes = await fetch(`/api/users/conversation/${otherUserId}`, { cache: 'no-store' });
            const uJson = await uRes.json().catch(() => null);
            const u = uJson?.data;
            const name = u?.displayName || u?.name || u?.email || 'User';
            const photoURL = u?.photoURL || u?.profile?.avatar;
            return {
              ...c,
              unreadForMe,
              otherUser: { id: otherUserId, name, photoURL, role: u?.role }
            };
          } catch {
            return { ...c, unreadForMe, otherUser: { id: otherUserId, name: 'User' } };
          }
        })
      );

      setConversations(enriched);
    } finally {
      setLoading(false);
    }
  };

  // Only poll while dropdown is mounted (i.e., open)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchConversations();
    pollingRef.current = setInterval(fetchConversations, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadTotal = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadForMe || 0), 0);
  }, [conversations]);

  const markAsRead = (conversationId: string) => {
    // Fire-and-forget. The inbox/modal also marks read, this just makes dropdown feel snappy.
    fetch(`/api/messages/conversation/${conversationId}`, { method: 'PATCH' }).catch(() => {});
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        </div>
        {unreadTotal > 0 && (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {unreadTotal} new
          </span>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((c) => {
              const name = c.otherUser?.name || 'User';
              const time = c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : '';
              const preview = (c.lastMessage || 'No messages yet').toString();
              const unread = c.unreadForMe || 0;

              return (
                <Link
                  key={c.id}
                  href={`${baseMessagesRoute}?conversation=${encodeURIComponent(c.id)}`}
                  onClick={() => {
                    markAsRead(c.id);
                    onClose?.();
                  }}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {c.otherUser?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.otherUser.photoURL}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {name}
                        </p>
                        {time && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {time}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate mt-1 ${unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {preview}
                      </p>
                    </div>

                    {unread > 0 && (
                      <div className="flex-shrink-0">
                        <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <Link
          href={baseMessagesRoute}
          onClick={onClose}
          className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Messages
        </Link>
      </div>
    </div>
  );
}
