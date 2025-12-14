'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { Message } from '@/types/firebase';
import { useSession } from 'next-auth/react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ShopMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopOwnerId: string;
  shopOwnerName: string;
  shopId?: string; // Optional shop ID for context
}

export function ShopMessageModal({
  isOpen,
  onClose,
  shopOwnerId,
  shopOwnerName,
  shopId
}: ShopMessageModalProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [usingApiPolling, setUsingApiPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false); // Track if initial load completed
  const lastLoadTimeRef = useRef(0); // Debounce mechanism for loadConversation
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  
  // Memoized loadConversation function to prevent unnecessary re-creations
  const loadConversation = useCallback(async (skipLoadingState = false) => {
    if (!user?.id) {
      if (!skipLoadingState) {
        setLoading(false);
      }
      return;
    }
    
    // Debounce: prevent calls within 500ms of each other
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 500) {
      return;
    }
    lastLoadTimeRef.current = now;

    try {
      if (!skipLoadingState) {
        setLoading(true);
      }
      
      // Get all conversations to find existing one with shop owner
      const getResponse = await fetch('/api/messages', { cache: 'no-store' });
      if (getResponse.ok) {
        const conversationsData = await getResponse.json();
        const conversations = conversationsData.data || [];
        
        // Find conversation with shop owner (prefer general/shop type, but accept any)
        const conversation = conversations.find((conv: any) => {
          const hasBothUsers = conv.participants?.includes(user.id) && conv.participants?.includes(shopOwnerId);
          if (!hasBothUsers) return false;
          
          // Prefer general/shop conversations, but accept any if no specific type
          const convType = conv.metadata?.type;
          return !convType || convType === 'general' || convType === 'shop';
        });
        
        if (conversation?.id) {
          // Only update conversationId if it changed to prevent unnecessary re-renders
          const newConversationId = conversation.id;
          if (conversationIdRef.current !== newConversationId) {
            startTransition(() => {
              setConversationId(newConversationId);
            });
            conversationIdRef.current = newConversationId;
          }
          
          // Load existing messages
          const messagesResponse = await fetch(
            `/api/messages/conversation/${newConversationId}?limit=50`,
            { cache: 'no-store' }
          );
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const newMessages = messagesData.data || [];
            
            // Only update if messages actually changed
            setMessages(prevMessages => {
              if (prevMessages.length === newMessages.length &&
                  prevMessages.every((msg, i) => msg.id === newMessages[i]?.id)) {
                return prevMessages; // No change, prevent re-render
              }
              return newMessages;
            });
            
            // Mark as read (only on initial load)
            if (!hasLoadedRef.current) {
              fetch(`/api/messages/conversation/${newConversationId}`, {
                method: 'PATCH'
              }).catch(() => {});
              hasLoadedRef.current = true;
            }
          } else {
            console.error('Failed to load messages:', messagesResponse.status);
          }
        } else {
          // No conversation exists yet - will be created when first message is sent
          startTransition(() => {
            if (conversationIdRef.current !== null) {
              setConversationId(null);
            }
            setMessages([]); // Clear messages if no conversation
            // Don't show loading for empty conversations
            if (!skipLoadingState) {
              setLoading(false);
            }
          });
          conversationIdRef.current = null;
        }
      } else {
        console.error('Failed to load conversations:', getResponse.status);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      // Always set loading to false in finally block
      if (!skipLoadingState) {
        setLoading(false);
      }
    }
  }, [user?.id, shopOwnerId]);

  // When the modal mounts already open (common, because parent conditionally renders it),
  // we must still load the conversation. So we load whenever `isOpen && user?.id`.
  useEffect(() => {
    if (!isOpen) return;
    if (!user?.id) return;

    // Reset per-open session state
    hasLoadedRef.current = false;
    lastLoadTimeRef.current = 0;
    setLoading(true);
    loadConversation(false);

    return () => {
      // Cleanup on close/unmount
      setMessages([]);
      setConversationId(null);
      conversationIdRef.current = null;
      setNewMessage('');
      setIsConnected(true);
      setUsingApiPolling(false);
      setLoading(false);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isOpen, user?.id, shopOwnerId, loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time listener for messages (with fallback to API polling)
  useEffect(() => {
    if (!conversationId || !user?.id || !isOpen) {
      // Cleanup if conditions not met
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Cleanup previous listener/polling before setting up new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Simple synchronous check for Firebase Auth
    const firebaseUser = auth.currentUser;
    const isFirebaseReady = firebaseUser && firebaseUser.uid === user.id;

    if (!isFirebaseReady) {
      // Firebase Auth not ready, use API polling immediately
      console.log('[ShopMessageModal] Firebase Auth not ready, using API polling');
      setUsingApiPolling(true);
      setIsConnected(true);
      
      // Start polling as fallback (conversationId exists here due to guard)
      pollingIntervalRef.current = setInterval(() => {
        loadConversation(true); // Skip loading state for polling
      }, 5000); // Increased from 3s to 5s
      return;
    }

    // Set up real-time listener directly
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          // Real-time is working
          setIsConnected(true);
          setUsingApiPolling(false);
          
          // Clear polling if it was active
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          const newMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            } as Message;
          });

          // Only update if messages changed
          setMessages(prevMessages => {
            if (prevMessages.length === newMessages.length &&
                prevMessages.every((msg, i) => msg.id === newMessages[i]?.id)) {
              return prevMessages; // No change
            }
            return newMessages;
          });

          // Mark unread messages as read when they arrive
          const unreadMessages = newMessages.filter(
            msg => !msg.isRead && msg.receiverId === user.id
          );
          
          if (unreadMessages.length > 0 && conversationId) {
            fetch(`/api/messages/conversation/${conversationId}`, {
              method: 'PATCH'
            }).catch(err => console.error('Error marking as read:', err));
          }
        },
        (error: any) => {
          // Handle errors gracefully
          if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
            console.log('[ShopMessageModal] Permission denied, using API polling');
            setUsingApiPolling(true);
            setIsConnected(true);
            
            // Start polling as fallback
            if (!pollingIntervalRef.current && conversationId) {
              pollingIntervalRef.current = setInterval(() => {
                loadConversation(true);
              }, 5000);
            }
          } else {
            console.error('Error listening to messages:', error);
            setIsConnected(false);
            
            // Fallback to polling on other errors too
            if (!pollingIntervalRef.current && conversationId) {
              setUsingApiPolling(true);
              pollingIntervalRef.current = setInterval(() => {
                loadConversation(true);
              }, 5000);
            }
          }
        }
      );
    } catch (error: any) {
      console.error('Failed to set up real-time listener:', error);
      setUsingApiPolling(true);
      setIsConnected(true);
      
      // Start polling as fallback
      if (!pollingIntervalRef.current && conversationId) {
        pollingIntervalRef.current = setInterval(() => {
          loadConversation(true);
        }, 5000);
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversationId, user?.id, isOpen, loadConversation]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: shopOwnerId,
          content: newMessage.trim(),
          conversationId: conversationId || undefined, // Will be created if not exists
          type: 'text'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // If conversation was just created, set the conversationId
        if (!conversationId && data.data?.conversationId) {
          startTransition(() => {
            setConversationId(data.data.conversationId);
          });
        }
        setNewMessage('');
        
        // Real-time listener will handle new messages if working
        // Only reload if using API polling (check ref to avoid stale closure)
        if (pollingIntervalRef.current) {
          setTimeout(() => {
            loadConversation(true);
          }, 500);
        }
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [newMessage, user?.id, sending, shopOwnerId, conversationId, loadConversation]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date | Timestamp | string) => {
    if (!date) return '';
    const d = date instanceof Date ? date : 
             (date as any)?.toDate ? (date as any).toDate() : 
             new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date | Timestamp | string) => {
    if (!date) return '';
    const d = date instanceof Date ? date : 
             (date as any)?.toDate ? (date as any).toDate() : 
             new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{shopOwnerName}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Messages Container */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            style={{ minHeight: '300px', maxHeight: 'calc(90vh - 200px)' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwn = message.senderId === user?.id;
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-lg px-4 py-2 ${
                            isOwn 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}

            {/* Connection Status - Only show if actually disconnected (not using API polling) */}
            {!isConnected && !usingApiPolling && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                Connection lost. Trying to reconnect...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

