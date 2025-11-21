import { BaseRepository } from './BaseRepository';
import { Conversation } from '@/types/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super(Collections.CONVERSATIONS);
  }

  /**
   * Get conversations for a user
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [{ field: 'participants', operator: 'array-contains', value: userId }],
      { field: 'lastMessageAt', direction: 'desc' }
    );
  }

  /**
   * Find conversation between specific users
   */
  async findBetweenUsers(userId1: string, userId2: string): Promise<Conversation | null> {
    const conversations = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'participants', operator: 'array-contains', value: userId1 }
      ]
    );

    // Filter to find conversation with both users
    const conversation = conversations.find(conv => 
      conv.participants.includes(userId2)
    );

    return conversation || null;
  }

  /**
   * Find or create conversation between users
   */
  async findOrCreateConversation(
    userId1: string, 
    userId2: string,
    metadata?: {
      customizationRequestId?: string;
      orderId?: string;
      type?: string;
    }
  ): Promise<Conversation> {
    // Try to find existing conversation
    const existing = await this.findBetweenUsers(userId1, userId2);
    if (existing) {
      return existing;
    }

    // Create new conversation
    const conversationData = {
      participants: [userId1, userId2],
      lastMessage: null,
      lastMessageAt: Timestamp.now(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      },
      metadata: metadata || {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return this.create(conversationData);
  }

  /**
   * Update conversation with latest message
   */
  async updateLastMessage(
    conversationId: string,
    lastMessage: string,
    senderId: string,
    receiverId: string
  ): Promise<Conversation> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const currentUnreadCount = conversation.unreadCount || {};
    
    return this.update(conversationId, {
      lastMessage: lastMessage as any,
      lastMessageAt: Timestamp.now() as any,
      unreadCount: {
        ...currentUnreadCount,
        [receiverId]: (currentUnreadCount[receiverId] || 0) + 1
      } as any,
      updatedAt: Timestamp.now() as any
    });
  }

  /**
   * Reset unread count for a user
   */
  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const currentUnreadCount = conversation.unreadCount || {};
    
    await this.update(conversationId, {
      unreadCount: {
        ...currentUnreadCount,
        [userId]: 0
      } as any,
      updatedAt: Timestamp.now() as any
    });
  }

  /**
   * Get conversations by customization request
   */
  async findByCustomizationRequest(customizationRequestId: string): Promise<Conversation[]> {
    const allConversations = await FirebaseAdminService.queryDocuments(
      this.collection,
      []
    );

    return allConversations.filter(conv => 
      (conv as any).metadata?.customizationRequestId === customizationRequestId
    );
  }
}

















