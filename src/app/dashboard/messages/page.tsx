'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Search, Loader2, User, Store, Briefcase } from 'lucide-react';
import { ShopMessageModal } from '@/components/messaging/ShopMessageModal';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date | Timestamp;
  unreadCount: Record<string, number>;
  metadata?: {
    type?: string;
    shopId?: string;
  };
  otherUser?: {
    id: string;
    name: string;
    photoURL?: string;
    role?: string;
  };
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationIdParam);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    shopOwnerId: string;
    shopOwnerName: string;
    shopId?: string;
  } | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [useApiFallback, setUseApiFallback] = useState(false);
  const autoOpenedFromUrlRef = useRef(false);

  // Wait for Firebase Auth to be ready
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.uid === user.id) {
        setFirebaseAuthReady(true);
        setUseApiFallback(false);
      } else if (firebaseUser && firebaseUser.uid !== user.id) {
        console.warn('[Messages] Firebase Auth UID mismatch:', {
          firebaseUid: firebaseUser.uid,
          sessionUid: user.id
        });
        // Sign out and try to get correct token
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        
        // Try to get correct token
        try {
          const response = await fetch('/api/auth/firebase-token', {
            credentials: 'include',
            cache: 'no-store'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
              const { signInWithCustomToken } = await import('firebase/auth');
              await signInWithCustomToken(auth, data.token);
              // Check again after sign in
              const newUser = auth.currentUser;
              if (newUser && newUser.uid === user.id) {
                setFirebaseAuthReady(true);
                setUseApiFallback(false);
              } else {
                console.warn('[Messages] Still have UID mismatch after re-sync, using API fallback');
                setUseApiFallback(true);
                setFirebaseAuthReady(false);
              }
            } else {
              setUseApiFallback(true);
              setFirebaseAuthReady(false);
            }
          } else {
            setUseApiFallback(true);
            setFirebaseAuthReady(false);
          }
        } catch (error) {
          console.error('[Messages] Failed to re-sync Firebase Auth:', error);
          setUseApiFallback(true);
          setFirebaseAuthReady(false);
        }
      } else {
        // No Firebase Auth user, try to sync
        try {
          const response = await fetch('/api/auth/firebase-token', {
            credentials: 'include',
            cache: 'no-store'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
              const { signInWithCustomToken } = await import('firebase/auth');
              await signInWithCustomToken(auth, data.token);
              setFirebaseAuthReady(true);
            } else {
              setUseApiFallback(true);
            }
          } else {
            setUseApiFallback(true);
          }
        } catch (error) {
          console.error('[Messages] Failed to sync Firebase Auth, using API fallback:', error);
          setUseApiFallback(true);
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Load conversations immediately when user is available (don't wait for Firebase Auth)
  useEffect(() => {
    if (user?.id && !authLoading) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // If user navigated here via notification link: /dashboard/messages?conversation=...
  // auto-open the chat modal for that conversation.
  useEffect(() => {
    if (!conversationIdParam) return;
    if (!user?.id) return;
    if (autoOpenedFromUrlRef.current) return;

    const conv = conversations.find(c => c.id === conversationIdParam);
    if (!conv) return; // wait until conversations are loaded

    const otherUserId =
      conv.otherUser?.id ||
      conv.participants?.find(id => id !== user.id);

    if (!otherUserId) return;

    setSelectedConversation(conversationIdParam);
    setMessageModalProps({
      shopOwnerId: otherUserId,
      shopOwnerName: conv.otherUser?.name || 'User',
      shopId: conv.metadata?.shopId
    });
    setShowMessageModal(true);
    autoOpenedFromUrlRef.current = true;
  }, [conversationIdParam, conversations, user?.id]);

  // Real-time listener for conversations (only if Firebase Auth is ready)
  useEffect(() => {
    if (!user?.id || !firebaseAuthReady || useApiFallback) {
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    // Create query - order by lastMessageAt if it exists, otherwise by createdAt
    // Note: Firestore requires an index for this query. If it fails, we'll sort client-side
    let q;
    try {
      q = query(
        conversationsRef,
        where('participants', 'array-contains', user.id),
        orderBy('lastMessageAt', 'desc')
      );
    } catch (error: any) {
      // If orderBy fails (e.g., missing index), use simpler query and sort client-side
      console.warn('Failed to create ordered query, using simple query:', error);
      q = query(
        conversationsRef,
        where('participants', 'array-contains', user.id)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const convs = (await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const conv: Conversation = {
              id: doc.id,
              participants: data.participants || [],
              lastMessage: data.lastMessage || data.lastMessageText || '',
              lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : 
                           data.lastMessageAt || 
                           data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                           data.updatedAt ||
                           data.createdAt?.toDate ? data.createdAt.toDate() : 
                           data.createdAt ||
                           new Date(),
              unreadCount: data.unreadCount || {},
              metadata: data.metadata || {}
            };
            
            // Skip conversations without participants (invalid data)
            if (!conv.participants || conv.participants.length === 0) {
              console.warn('Skipping conversation without participants:', doc.id);
              return null;
            }

            // Get other user info
            const otherUserId = conv.participants.find(id => id !== user.id);
            if (otherUserId) {
              try {
                const userResponse = await fetch(`/api/users/conversation/${otherUserId}`);
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.data) {
                    conv.otherUser = {
                      id: userData.data.id,
                      name: userData.data.displayName || userData.data.name || userData.data.email || 'Unknown',
                      photoURL: userData.data.photoURL || userData.data.profile?.avatar,
                      role: userData.data.role
                    };
                  } else {
                    // Set fallback so conversation still shows
                    conv.otherUser = {
                      id: otherUserId,
                      name: 'User',
                      role: undefined
                    };
                  }
                } else {
                  console.error('[Messages] Failed to fetch user:', otherUserId, '- Status:', userResponse.status);
                  // Set fallback so conversation still shows
                  conv.otherUser = {
                    id: otherUserId,
                    name: 'User',
                    role: undefined
                  };
                }
              } catch (error) {
                console.error('[Messages] Error fetching user:', otherUserId, error);
                // Set fallback so conversation still shows
                conv.otherUser = {
                  id: otherUserId,
                  name: 'User',
                  role: undefined
                };
              }
            } else {
              console.warn('[Messages] No other user ID found in conversation:', conv.id);
            }

            return conv;
          })
        )).filter((conv): conv is Conversation => conv !== null);

        // Sort conversations by lastMessageAt if we used the simple query
        const sortedConvs = convs.sort((a, b) => {
          const aTime = a.lastMessageAt instanceof Date ? a.lastMessageAt.getTime() : 
                       (a.lastMessageAt as any)?.toDate ? (a.lastMessageAt as any).toDate().getTime() : 0;
          const bTime = b.lastMessageAt instanceof Date ? b.lastMessageAt.getTime() : 
                       (b.lastMessageAt as any)?.toDate ? (b.lastMessageAt as any).toDate().getTime() : 0;
          return bTime - aTime; // Descending order
        });
        
        setConversations(sortedConvs);
        setLoading(false);
      },
      (error) => {
        console.error('[Messages] Error listening to conversations:', error);
        // Fallback to API if Firestore fails
        setUseApiFallback(true);
        // Don't call loadConversations here - let the other effect handle it
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, firebaseAuthReady, useApiFallback]);

  const loadConversations = async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/messages', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('[Messages] Failed to fetch conversations:', response.status, errorText);
        setConversations([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const conversationsList = data.data || [];
        
        // Enrich with user details and filter out invalid conversations
        const enriched = (await Promise.all(
          conversationsList.map(async (conv: Conversation) => {
            // Ensure participants array exists
            if (!conv.participants || conv.participants.length === 0) {
              console.warn('[Messages] Skipping conversation without participants:', conv.id);
              return null;
            }
            
            // Ensure lastMessageAt exists (use fallback if missing)
            if (!conv.lastMessageAt) {
              conv.lastMessageAt = new Date();
            }
            
            const otherUserId = conv.participants.find(id => id !== user.id);
            
            if (otherUserId && !conv.otherUser) {
              try {
                const userResponse = await fetch(`/api/users/conversation/${otherUserId}`);
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.data) {
                    conv.otherUser = {
                      id: userData.data.id,
                      name: userData.data.displayName || userData.data.name || userData.data.email || 'Unknown',
                      photoURL: userData.data.photoURL || userData.data.profile?.avatar,
                      role: userData.data.role
                    };
                  } else {
                    conv.otherUser = { id: otherUserId, name: 'User', role: undefined };
                  }
                } else {
                  const errorText = await userResponse.text().catch(() => '');
                  console.error('[Messages] Failed to fetch user:', otherUserId, '- Status:', userResponse.status, '- Error:', errorText);
                  // Set a fallback name so conversation still shows
                  conv.otherUser = {
                    id: otherUserId,
                    name: 'Loading...',
                    role: undefined
                  };
                }
              } catch (error) {
                console.error('[Messages] Error fetching user:', otherUserId, error);
                // Set a fallback name so conversation still shows
                conv.otherUser = {
                  id: otherUserId,
                  name: 'User',
                  role: undefined
                };
              }
            } else if (!otherUserId) {
              console.warn('[Messages] No other user found in conversation:', conv.id, 'participants:', conv.participants);
            }
            return conv;
          })
        )).filter((conv): conv is Conversation => conv !== null);
        
        setConversations(enriched);
      } else {
        console.error('[Messages] API returned error:', data.error);
        setConversations([]);
      }
    } catch (error: any) {
      console.error('[Messages] ===== ERROR in loadConversations =====');
      console.error('[Messages] Error type:', error?.constructor?.name);
      console.error('[Messages] Error message:', error?.message);
      console.error('[Messages] Error stack:', error?.stack);
      console.error('[Messages] Full error object:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.otherUser?.name?.toLowerCase().includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query)
    );
  });

  const formatTime = (date: Date | Timestamp | string | undefined) => {
    if (!date) return '';
    const d = date instanceof Date ? date : 
             (date as any)?.toDate ? (date as any).toDate() : 
             new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleConversationClick = (conv: Conversation) => {
    // Get the other user ID from participants if otherUser isn't loaded yet
    const otherUserId = conv.otherUser?.id || conv.participants.find(id => id !== user?.id);
    
    if (otherUserId) {
      setSelectedConversation(conv.id);
      
      // Update URL without causing a full page reload
      const newUrl = `/dashboard/messages?conversation=${conv.id}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
      
      // Open message modal - use otherUser if available, otherwise use fallback
      // Only update if props actually changed to prevent unnecessary re-renders
      const newProps = {
        shopOwnerId: otherUserId,
        shopOwnerName: conv.otherUser?.name || 'User',
        shopId: conv.metadata?.shopId
      };
      
      // Check if props are different before updating
      if (!messageModalProps || 
          messageModalProps.shopOwnerId !== newProps.shopOwnerId ||
          messageModalProps.shopOwnerName !== newProps.shopOwnerName) {
        setMessageModalProps(newProps);
      }
      
      if (!showMessageModal) {
        setShowMessageModal(true);
      }
    } else {
      console.error('[Messages] Cannot open conversation - no other user ID found:', conv);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'business_owner':
        return <Store className="w-3 h-3" />;
      case 'designer':
        return <Briefcase className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} />
        <div className="flex">
          <DashboardSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar user={user} />
        <div className="flex-1 lg:ml-64">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
                  <p className="text-gray-600">Manage your conversations with customers and shop owners</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading && conversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? 'No conversations match your search'
                        : 'Start a conversation by messaging a shop owner or customer'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((conv) => {
                      const unreadCount = conv.unreadCount?.[user?.id || ''] || 0;
                      const isSelected = selectedConversation === conv.id;

                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleConversationClick(conv)}
                          className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                            isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {conv.otherUser?.photoURL ? (
                                <img
                                  src={conv.otherUser.photoURL}
                                  alt={conv.otherUser.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-lg">
                                    {conv.otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-semibold ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {conv.otherUser?.name || 'Loading...'}
                                  </h3>
                                  {conv.otherUser?.role && (
                                    <div className="text-gray-400">
                                      {getRoleIcon(conv.otherUser.role)}
                                    </div>
                                  )}
                                </div>
                                {conv.lastMessageAt && (
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatTime(conv.lastMessageAt)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm truncate ${
                                unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                              }`}>
                                {conv.lastMessage || 'No messages yet'}
                              </p>
                            </div>

                            {/* Unread Badge */}
                            {unreadCount > 0 && (
                              <div className="flex-shrink-0">
                                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && messageModalProps && (
        <ShopMessageModal
          key={messageModalProps.shopOwnerId} // Use key to prevent unnecessary remounts
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            // Don't clear props immediately - let modal handle cleanup
            setTimeout(() => {
              setMessageModalProps(null);
              // Update URL without full reload
              window.history.pushState({}, '', '/dashboard/messages');
            }, 300); // Small delay to allow modal close animation
          }}
          shopOwnerId={messageModalProps.shopOwnerId}
          shopOwnerName={messageModalProps.shopOwnerName}
          shopId={messageModalProps.shopId}
        />
      )}
    </div>
  );
}

