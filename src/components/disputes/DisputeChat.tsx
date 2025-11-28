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

export function DisputeChat({
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          } as Message;
        });
        setMessages(newMessages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
      }
    );

    return () => unsubscribe();
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

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
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
      await fetch('/api/messages', {
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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold">Dispute Conversation</h3>
        <p className="text-sm text-gray-600">Discussing with {otherUserName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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






