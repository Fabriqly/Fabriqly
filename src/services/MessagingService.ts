import { MessageRepository } from '@/repositories/MessageRepository';
import { ConversationRepository } from '@/repositories/ConversationRepository';
import { Message, Conversation } from '@/types/firebase';
import { Timestamp } from 'firebase/firestore';
import { eventBus } from '@/events/EventBus';
import { AppError } from '@/errors/AppError';

export interface SendMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  customizationRequestId?: string;
  orderId?: string;
}

export interface ConversationWithDetails extends Conversation {
  otherUser?: {
    id: string;
    name: string;
    photoURL?: string;
    role?: string;
  };
  unreadCount?: number;
}

export class MessagingService {
  private messageRepo: MessageRepository;
  private conversationRepo: ConversationRepository;

  constructor() {
    this.messageRepo = new MessageRepository();
    this.conversationRepo = new ConversationRepository();
  }

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    // Validate
    if (!data.senderId || !data.receiverId) {
      throw AppError.badRequest('Sender and receiver are required');
    }

    if (!data.content && (!data.attachments || data.attachments.length === 0)) {
      throw AppError.badRequest('Message content or attachments are required');
    }

    // Find or create conversation
    const conversation = await this.conversationRepo.findOrCreateConversation(
      data.senderId,
      data.receiverId,
      {
        customizationRequestId: data.customizationRequestId,
        orderId: data.orderId,
        type: data.customizationRequestId ? 'customization' : data.orderId ? 'order' : 'general'
      }
    );

    // Create message
    const messageData = {
      senderId: data.senderId,
      receiverId: data.receiverId,
      conversationId: conversation.id,
      content: data.content,
      type: data.type || 'text',
      isRead: false,
      attachments: data.attachments || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const message = await this.messageRepo.create(messageData);

    // Update conversation
    await this.conversationRepo.updateLastMessage(
      conversation.id,
      data.content.substring(0, 100), // Store first 100 chars as preview
      data.senderId,
      data.receiverId
    );

    // Emit event for real-time notifications
    await eventBus.emit('message.sent', {
      messageId: message.id,
      conversationId: conversation.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content
    });

    return message;
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit: number = 50
  ): Promise<Message[]> {
    // Verify user is participant
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw AppError.forbidden('You are not a participant in this conversation');
    }

    const messages = await this.messageRepo.findByConversationId(conversationId, limit);
    
    // Sort ascending (oldest first) for display
    return messages.reverse();
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
    const conversations = await this.conversationRepo.findByUserId(userId);
    
    // TODO: Populate with other user details
    // For now, return basic conversations
    return conversations.map(conv => ({
      ...conv,
      unreadCount: conv.unreadCount?.[userId] || 0
    }));
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw AppError.notFound('Message not found');
    }

    if (message.receiverId !== userId) {
      throw AppError.forbidden('You can only mark your own messages as read');
    }

    await this.messageRepo.markAsRead(messageId);
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Verify user is participant
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw AppError.forbidden('You are not a participant in this conversation');
    }

    await this.messageRepo.markConversationAsRead(conversationId, userId);
    await this.conversationRepo.resetUnreadCount(conversationId, userId);
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unreadMessages = await this.messageRepo.findUnreadByReceiver(userId);
    return unreadMessages.length;
  }

  /**
   * Get or create conversation for customization request
   */
  async getCustomizationConversation(
    customizationRequestId: string,
    customerId: string,
    designerId: string
  ): Promise<Conversation> {
    // Check if conversation already exists for this customization
    const existing = await this.conversationRepo.findByCustomizationRequest(customizationRequestId);
    
    if (existing.length > 0) {
      return existing[0];
    }

    // Create new conversation
    return this.conversationRepo.findOrCreateConversation(
      customerId,
      designerId,
      {
        customizationRequestId,
        type: 'customization'
      }
    );
  }

  /**
   * Create dispute conversation
   */
  async createDisputeConversation(
    party1Id: string,
    party2Id: string,
    orderId?: string,
    customizationRequestId?: string
  ): Promise<Conversation> {
    return this.conversationRepo.findOrCreateConversation(
      party1Id,
      party2Id,
      {
        orderId,
        customizationRequestId,
        type: 'dispute'
      }
    );
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw AppError.forbidden('You are not a participant in this conversation');
    }

    // Delete all messages in conversation
    const messages = await this.messageRepo.findByConversationId(conversationId, 1000);
    await Promise.all(messages.map(msg => this.messageRepo.delete(msg.id)));

    // Delete conversation
    await this.conversationRepo.delete(conversationId);
  }
}



















