'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/firebase';
import { useSession } from 'next-auth/react';

interface TransactionChatProps {
  customizationRequestId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: 'customer' | 'designer';
  onDesignApproved?: () => void; // Callback when design is approved
}

export function TransactionChat({
  customizationRequestId,
  otherUserId,
  otherUserName,
  otherUserRole,
  onDesignApproved
}: TransactionChatProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [markAsFinal, setMarkAsFinal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversation();
  }, [customizationRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/customization/${customizationRequestId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
        setConversationId(data.data.conversation.id);
        
        // Mark as read
        if (data.data.conversation.id) {
          await fetch(`/api/messages/conversation/${data.data.conversation.id}`, {
            method: 'PATCH'
          });
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);

      // Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'design-attachments');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error('File upload failed');
      }

      // Send message with attachment
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage.trim() || `Sent a file: ${selectedFile.name}`,
          type: 'file',
          customizationRequestId,
          attachments: [
            {
              name: selectedFile.name,
              url: uploadData.data.url,
              type: selectedFile.type,
              size: selectedFile.size,
              isFinalDesign: markAsFinal,
            },
          ],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage('');
        setSelectedFile(null);
        setMarkAsFinal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFile) {
      await handleUploadFile();
      return;
    }

    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage,
          type: 'text',
          customizationRequestId
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleApproveDesign = async (messageId: string) => {
    if (!confirm('Are you sure you want to approve this design? This will trigger payment to the designer.')) {
      return;
    }

    try {
      setApproving(true);
      const response = await fetch(`/api/customizations/${customizationRequestId}/approve-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Design approved! Designer will be paid shortly.');
        if (onDesignApproved) {
          onDesignApproved();
        }
      } else {
        throw new Error(data.error || 'Failed to approve design');
      }
    } catch (error: any) {
      console.error('Error approving design:', error);
      alert(error.message || 'Failed to approve design');
    } finally {
      setApproving(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle Firestore Timestamp object with seconds and nanoseconds
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Handle plain Date or timestamp string
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          Chat with {otherUserName}
        </h3>
        <p className="text-sm text-gray-500">
          {otherUserRole === 'designer' ? 'Designer' : 'Customer'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            const hasFinalDesign = message.attachments?.some((att) => att.isFinalDesign);
            const canApprove = !isOwn && hasFinalDesign && otherUserRole === 'designer';
            
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  
                  {/* Display attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded border ${
                            isOwn ? 'border-blue-400 bg-blue-500' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {attachment.isFinalDesign && (
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded mb-2">
                              ✓ Final Design
                            </span>
                          )}
                          {attachment.type.startsWith('image/') ? (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full h-auto rounded"
                              />
                            </a>
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
                            >
                              📎 {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
                
                {/* Approve button for customer viewing final design */}
                {canApprove && (
                  <button
                    onClick={() => handleApproveDesign(message.id)}
                    disabled={approving}
                    className="mt-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {approving ? 'Approving...' : '✓ Approve Final Design'}
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-3">
        {/* File upload section */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                📎 {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {/* Designer: Mark as final design checkbox */}
        {otherUserRole === 'customer' && selectedFile && (
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={markAsFinal}
              onChange={(e) => setMarkAsFinal(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">Mark as Final Design</span>
          </label>
        )}

        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedFile ? 'Add a message (optional)...' : 'Type your message...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending || uploading}
          />
          
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.ai,.psd,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={sending || uploading}
          >
            📎
          </button>

          <button
            type="submit"
            disabled={sending || uploading || (!newMessage.trim() && !selectedFile)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

