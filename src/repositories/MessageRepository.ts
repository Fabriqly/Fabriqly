import { BaseRepository } from './BaseRepository';
import { Message, Conversation } from '@/types/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';

export class MessageRepository extends BaseRepository<Message> {
  constructor() {
    super(Collections.MESSAGES);
  }

  /**
   * Get messages by conversation ID
   */
  async findByConversationId(conversationId: string, limit: number = 50): Promise<Message[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [{ field: 'conversationId', operator: '==', value: conversationId }],
      { field: 'createdAt', direction: 'desc' },
      limit
    );
  }

  /**
   * Get unread messages for a user
   */
  async findUnreadByReceiver(receiverId: string): Promise<Message[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'receiverId', operator: '==', value: receiverId },
        { field: 'isRead', operator: '==', value: false }
      ],
      { field: 'createdAt', direction: 'desc' }
    );
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<Message> {
    return this.update(messageId, {
      isRead: true as any,
      updatedAt: Timestamp.now() as any
    });
  }

  /**
   * Mark all messages in conversation as read for a user
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const messages = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'conversationId', operator: '==', value: conversationId },
        { field: 'receiverId', operator: '==', value: userId },
        { field: 'isRead', operator: '==', value: false }
      ]
    );

    const updatePromises = messages.map(msg => 
      this.update(msg.id, { 
        isRead: true as any,
        updatedAt: Timestamp.now() as any
      })
    );

    await Promise.all(updatePromises);
  }

  /**
   * Get messages between two users
   */
  async findBetweenUsers(userId1: string, userId2: string, limit: number = 50): Promise<Message[]> {
    const sent = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'senderId', operator: '==', value: userId1 },
        { field: 'receiverId', operator: '==', value: userId2 }
      ]
    );

    const received = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'senderId', operator: '==', value: userId2 },
        { field: 'receiverId', operator: '==', value: userId1 }
      ]
    );

    const allMessages = [...sent, ...received];
    
    // Sort by createdAt
    return allMessages
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  /**
   * Get unread count by conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const messages = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'conversationId', operator: '==', value: conversationId },
        { field: 'receiverId', operator: '==', value: userId },
        { field: 'isRead', operator: '==', value: false }
      ]
    );

    return messages.length;
  }
}












