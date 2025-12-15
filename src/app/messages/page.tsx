'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ShopMessageModal } from '@/components/messaging/ShopMessageModal';
import { Loader2, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  participants: string[];
  metadata?: {
    shopId?: string;
    type?: string;
  };
  otherUser?: {
    id: string;
    name: string;
    role?: string;
  };
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const conversationId = useMemo(() => searchParams.get('conversation'), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    shopOwnerId: string;
    shopOwnerName: string;
    shopId?: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/messages?conversation=${conversationId || ''}`)}`);
    }
  }, [status, router, conversationId]);

  useEffect(() => {
    const run = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return;

      if (!conversationId) {
        setLoading(false);
        setError('No conversation selected.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1) Find the conversation and other participant
        const convRes = await fetch('/api/messages', { cache: 'no-store' });
        const convJson = await convRes.json().catch(() => null);
        const conversations: Conversation[] = convJson?.data || [];
        const conv = conversations.find(c => c.id === conversationId);

        if (!conv) {
          setError('Conversation not found.');
          setLoading(false);
          return;
        }

        const currentUserId = session.user.id;
        const otherUserId =
          conv.otherUser?.id ||
          conv.participants.find(id => id !== currentUserId);

        if (!otherUserId) {
          setError('Unable to open conversation.');
          setLoading(false);
          return;
        }

        // 2) Fetch basic user info (secure: only if a conversation exists)
        let otherName = conv.otherUser?.name || 'User';
        try {
          const userRes = await fetch(`/api/users/conversation/${otherUserId}`, { cache: 'no-store' });
          const userJson = await userRes.json().catch(() => null);
          const u = userJson?.data;
          if (u?.displayName) otherName = u.displayName;
        } catch {
          // ignore, we'll use fallback name
        }

        setMessageModalProps({
          shopOwnerId: otherUserId,
          shopOwnerName: otherName,
          shopId: conv.metadata?.shopId
        });
        setShowMessageModal(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to open conversation.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [status, session?.user?.id, conversationId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />

      <div className="flex gap-8 p-8">
        <CustomerNavigationSidebar />

        <main className="flex-1">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-2">Your conversation will open automatically.</p>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">{error}</p>
                <button
                  onClick={() => router.back()}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Go back
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                <p className="text-gray-600">Opening chat…</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <ScrollToTop />

      {showMessageModal && messageModalProps && (
        <ShopMessageModal
          key={messageModalProps.shopOwnerId}
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            // Return user to where they came from (notification click)
            setTimeout(() => router.back(), 150);
          }}
          shopOwnerId={messageModalProps.shopOwnerId}
          shopOwnerName={messageModalProps.shopOwnerName}
          shopId={messageModalProps.shopId}
        />
      )}
    </div>
  );
}


