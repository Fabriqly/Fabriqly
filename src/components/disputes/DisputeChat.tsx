'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, DollarSign, Paperclip, X } from 'lucide-react';
import { Message } from '@/types/firebase';
import { Dispute } from '@/types/dispute';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';

interface DisputeChatProps {
  disputeId: string;
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  canOfferPartialRefund?: boolean;
  dispute: Dispute;
}

function DisputeChat({
  disputeId,
  conversationId,
  otherUserId,
  otherUserName,
  canOfferPartialRefund = false,
  dispute
}: DisputeChatProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPartialRefundForm, setShowPartialRefundForm] = useState(false);
  const [partialRefundAmount, setPartialRefundAmount] = useState('');
  const [partialRefundPercentage, setPartialRefundPercentage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    // Load messages via API (bypasses Firestore security rules)
    const loadMessagesViaAPI = async () => {
      if (!conversationId) {
        console.warn('[DisputeChat] No conversationId provided, skipping load');
        return;
      }

      try {
        // Validate conversationId before making request
        if (!conversationId || typeof conversationId !== 'string' || conversationId.trim() === '') {
          console.error('[DisputeChat] Invalid conversationId:', conversationId);
          setIsConnected(false);
          return;
        }

        setIsConnected(true);
        const url = `/api/messages/conversation/${encodeURIComponent(conversationId)}?limit=100`;
        console.log('[DisputeChat] Fetching messages from:', url);
        
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch((fetchError) => {
          // Handle network errors
          console.error('[DisputeChat] Network error:', fetchError);
          throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server'}`);
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}` };
          }
          throw new Error(errorData.error || `Failed to fetch messages: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data) {
          console.log('[DisputeChat] Loaded', data.data.length, 'messages from API');
          // Convert timestamps properly
          const processedMessages = data.data.map((msg: any) => {
            let createdAt: Date;
            // Handle various timestamp formats
            if (msg.createdAt?.toDate) {
              createdAt = msg.createdAt.toDate();
            } else if (msg.createdAt?.seconds) {
              createdAt = new Date(msg.createdAt.seconds * 1000);
            } else if (msg.createdAt instanceof Date) {
              createdAt = msg.createdAt;
            } else if (typeof msg.createdAt === 'string') {
              // Handle ISO string format from JSON serialization
              createdAt = new Date(msg.createdAt);
            } else if (msg.createdAt) {
              createdAt = new Date(msg.createdAt);
            } else {
              createdAt = new Date();
            }

            let updatedAt: Date;
            // Handle various timestamp formats
            if (msg.updatedAt?.toDate) {
              updatedAt = msg.updatedAt.toDate();
            } else if (msg.updatedAt?.seconds) {
              updatedAt = new Date(msg.updatedAt.seconds * 1000);
            } else if (msg.updatedAt instanceof Date) {
              updatedAt = msg.updatedAt;
            } else if (typeof msg.updatedAt === 'string') {
              // Handle ISO string format from JSON serialization
              updatedAt = new Date(msg.updatedAt);
            } else if (msg.updatedAt) {
              updatedAt = new Date(msg.updatedAt);
            } else {
              updatedAt = new Date();
            }

            return {
              ...msg,
              createdAt,
              updatedAt
            } as Message;
          });
          // Sort by createdAt (ascending - oldest first)
          processedMessages.sort((a: Message, b: Message) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
            return aTime - bTime;
          });
          
          // Only update state if messages actually changed (prevent unnecessary re-renders)
          setMessages(prevMessages => {
            // Check if messages are different
            if (prevMessages.length !== processedMessages.length) {
              console.log('[DisputeChat] Setting', processedMessages.length, 'processed messages (count changed)');
              return processedMessages;
            }
            
            // Check if any message IDs are different
            const prevIds = prevMessages.map(m => m.id).sort().join(',');
            const newIds = processedMessages.map(m => m.id).sort().join(',');
            if (prevIds !== newIds) {
              console.log('[DisputeChat] Setting', processedMessages.length, 'processed messages (content changed)');
              return processedMessages;
            }
            
            // Messages are the same, don't update
            return prevMessages;
          });
        } else {
          console.warn('[DisputeChat] API response not successful:', data);
          setIsConnected(false);
        }
      } catch (error: any) {
        console.error('[DisputeChat] Error loading messages via API:', error);
        console.error('[DisputeChat] Error details:', {
          conversationId,
          conversationIdType: typeof conversationId,
          conversationIdLength: conversationId?.length,
          errorMessage: error.message,
          errorName: error.name
        });
        setIsConnected(false);
        
        // Don't show alert for network errors during polling (too noisy)
        // Only show for initial load failures
        if (messages.length === 0) {
          if (error.message?.includes('Failed to fetch') || error.message?.includes('Network error')) {
            console.warn('[DisputeChat] Initial load failed - this might be because:');
            console.warn('1. The conversationId might not exist yet');
            console.warn('2. Network connectivity issue');
            console.warn('3. Server might not be running');
            console.warn('Will retry on next poll...');
          }
        }
      }
    };

    // Use API as primary method since Firestore rules are blocking queries
    // Load initial messages immediately
    loadMessagesViaAPI();
    
    // Set up polling to refresh messages every 3 seconds (reasonable balance)
    const pollInterval = setInterval(() => {
      loadMessagesViaAPI();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage,
          conversationId: conversationId,
          customizationRequestId: dispute.customizationRequestId,
          orderId: dispute.orderId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      console.log('[DisputeChat] Message sent successfully:', data.data);
      setNewMessage('');
      
      // Reload messages after sending (single reload after short delay)
      // The polling will also pick it up, so we don't need multiple reloads
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/messages/conversation/${conversationId}?limit=200&_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          const apiData = await response.json();
          if (apiData.success && apiData.data) {
            // Convert timestamps properly
            const processedMessages = apiData.data.map((msg: any) => {
              let createdAt: Date;
              if (msg.createdAt?.toDate) {
                createdAt = msg.createdAt.toDate();
              } else if (msg.createdAt?.seconds) {
                createdAt = new Date(msg.createdAt.seconds * 1000);
              } else if (msg.createdAt instanceof Date) {
                createdAt = msg.createdAt;
              } else if (typeof msg.createdAt === 'string') {
                createdAt = new Date(msg.createdAt);
              } else if (msg.createdAt) {
                createdAt = new Date(msg.createdAt);
              } else {
                createdAt = new Date();
              }

              let updatedAt: Date;
              if (msg.updatedAt?.toDate) {
                updatedAt = msg.updatedAt.toDate();
              } else if (msg.updatedAt?.seconds) {
                updatedAt = new Date(msg.updatedAt.seconds * 1000);
              } else if (msg.updatedAt instanceof Date) {
                updatedAt = msg.updatedAt;
              } else if (typeof msg.updatedAt === 'string') {
                updatedAt = new Date(msg.updatedAt);
              } else if (msg.updatedAt) {
                updatedAt = new Date(msg.updatedAt);
              } else {
                updatedAt = new Date();
              }

              return {
                ...msg,
                createdAt,
                updatedAt
              } as Message;
            });
            // Sort by createdAt
            processedMessages.sort((a: Message, b: Message) => {
              const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime();
              const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime();
              return aTime - bTime;
            });
            // Use the same smart update logic to prevent loops
            setMessages(prevMessages => {
              if (prevMessages.length !== processedMessages.length) {
                return processedMessages;
              }
              const prevIds = prevMessages.map(m => m.id).sort().join(',');
              const newIds = processedMessages.map(m => m.id).sort().join(',');
              if (prevIds !== newIds) {
                return processedMessages;
              }
              return prevMessages;
            });
          }
        } catch (error) {
          console.error('Error reloading messages:', error);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user?.id) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');

      const uploadResponse = await fetch('/api/customizations/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.data.url;

      // Send message with attachment
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: `Shared a file: ${file.name}`,
          conversationId: conversationId,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          attachments: [{
            name: file.name,
            url: fileUrl,
            type: file.type,
            size: file.size
          }],
          customizationRequestId: dispute.customizationRequestId,
          orderId: dispute.orderId
        })
      });

      const messageData = await messageResponse.json();
      if (!messageResponse.ok) {
        throw new Error(messageData.error || 'Failed to send file message');
      }
      
      // Reload messages after sending file
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/messages/conversation/${conversationId}`);
          const apiData = await response.json();
          if (apiData.success && apiData.data) {
            const processedMessages = apiData.data.map((msg: any) => ({
              ...msg,
              createdAt: msg.createdAt?.toDate ? msg.createdAt.toDate() :
                        msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000) :
                        msg.createdAt instanceof Date ? msg.createdAt :
                        msg.createdAt ? new Date(msg.createdAt) : new Date(),
              updatedAt: msg.updatedAt?.toDate ? msg.updatedAt.toDate() :
                        msg.updatedAt?.seconds ? new Date(msg.updatedAt.seconds * 1000) :
                        msg.updatedAt instanceof Date ? msg.updatedAt :
                        msg.updatedAt ? new Date(msg.updatedAt) : new Date()
            }));
            setMessages(processedMessages);
          }
        } catch (error) {
          console.error('Error reloading messages:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleOfferPartialRefund = async () => {
    if (!partialRefundAmount && !partialRefundPercentage) {
      alert('Please enter either an amount or percentage');
      return;
    }

    try {
      setSending(true);
      const response = await fetch(`/api/disputes/${disputeId}/partial-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: partialRefundAmount ? parseFloat(partialRefundAmount) : undefined,
          percentage: partialRefundPercentage ? parseFloat(partialRefundPercentage) : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to offer partial refund');
      }

      setShowPartialRefundForm(false);
      setPartialRefundAmount('');
      setPartialRefundPercentage('');
      alert('Partial refund offer submitted');
    } catch (error: any) {
      alert(error.message || 'Failed to offer partial refund');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date | any) => {
    try {
      let dateObj: Date;
      if (date instanceof Date) {
        dateObj = date;
      } else if (date?.toDate) {
        dateObj = date.toDate();
      } else if (date?.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } else if (typeof date === 'string' || typeof date === 'number') {
        dateObj = new Date(date);
      } else {
        dateObj = new Date();
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting time:', error, date);
      return 'Invalid date';
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Dispute Conversation</h3>
            <p className="text-sm text-gray-600">Discussing with {otherUserName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs underline"
                    >
                      {att.name}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1 opacity-75">
                {formatTime(message.createdAt as Date)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Partial Refund Offer Form */}
      {showPartialRefundForm && canOfferPartialRefund && (
        <div className="p-4 border-t bg-purple-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-purple-900">Offer Partial Refund</h4>
            <button
              onClick={() => setShowPartialRefundForm(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              placeholder="Amount (₱)"
              value={partialRefundAmount}
              onChange={(e) => setPartialRefundAmount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Percentage (%)"
              value={partialRefundPercentage}
              onChange={(e) => setPartialRefundPercentage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <Button
            onClick={handleOfferPartialRefund}
            disabled={sending}
            size="sm"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Submit Offer
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        {canOfferPartialRefund && !showPartialRefundForm && (
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPartialRefundForm(true)}
              className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Offer Partial Refund
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DisputeChat };
export default DisputeChat;

