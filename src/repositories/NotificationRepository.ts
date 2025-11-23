import { BaseRepository, QueryFilter } from './BaseRepository';
import { Notification, NotificationFilters, NotificationPagination } from '@/types/notification';
import { Collections } from '@/services/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super(Collections.NOTIFICATIONS);
  }

  /**
   * Find notifications by user ID with filters and pagination
   */
  async findByUserId(
    userId: string,
    filters?: NotificationFilters,
    pagination?: NotificationPagination
  ): Promise<Notification[]> {
    const queryFilters: QueryFilter[] = [
      { field: 'userId', operator: '==', value: userId }
    ];

    if (filters?.type) {
      queryFilters.push({ field: 'type', operator: '==', value: filters.type });
    }

    if (filters?.category) {
      queryFilters.push({ field: 'category', operator: '==', value: filters.category });
    }

    if (filters?.isRead !== undefined) {
      queryFilters.push({ field: 'isRead', operator: '==', value: filters.isRead });
    }

    if (filters?.priority) {
      queryFilters.push({ field: 'priority', operator: '==', value: filters.priority });
    }

    if (filters?.startDate) {
      queryFilters.push({ field: 'createdAt', operator: '>=', value: filters.startDate });
    }

    if (filters?.endDate) {
      queryFilters.push({ field: 'createdAt', operator: '<=', value: filters.endDate });
    }

    const orderBy = { field: 'createdAt', direction: 'desc' as const };
    const limit = pagination?.limit || 50;

    return FirebaseAdminService.queryDocuments(
      this.collection,
      queryFilters,
      orderBy,
      limit
    ) as Promise<Notification[]>;
  }

  /**
   * Find unread notifications by user ID
   */
  async findUnreadByUserId(userId: string, limit?: number): Promise<Notification[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isRead', operator: '==', value: false }
      ],
      { field: 'createdAt', direction: 'desc' },
      limit || 50
    ) as Promise<Notification[]>;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // Verify the notification belongs to the user
    const notification = await this.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new Error('Unauthorized: Notification does not belong to user');
    }

    return this.update(notificationId, {
      isRead: true,
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    } as Partial<Notification>);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unreadNotifications = await this.findUnreadByUserId(userId, 1000);
    
    const updatePromises = unreadNotifications.map(notification =>
      this.update(notification.id, {
        isRead: true,
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Partial<Notification>)
    );

    await Promise.all(updatePromises);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const unreadNotifications = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isRead', operator: '==', value: false }
      ]
    );

    return unreadNotifications.length;
  }

  /**
   * Delete old notifications for a user (older than specified days)
   */
  async deleteOldNotifications(userId: string, daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldNotifications = await FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'createdAt', operator: '<', value: cutoffDate }
      ]
    );

    const deletePromises = oldNotifications.map(notification =>
      this.delete(notification.id)
    );

    await Promise.all(deletePromises);
  }

  /**
   * Get notifications by related entity
   */
  async findByRelatedEntity(
    userId: string,
    relatedEntityType: string,
    relatedEntityId: string
  ): Promise<Notification[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'relatedEntityType', operator: '==', value: relatedEntityType },
        { field: 'relatedEntityId', operator: '==', value: relatedEntityId }
      ],
      { field: 'createdAt', direction: 'desc' }
    ) as Promise<Notification[]>;
  }

  /**
   * Get recent notifications for a user (last N notifications)
   */
  async getRecentNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    return FirebaseAdminService.queryDocuments(
      this.collection,
      [{ field: 'userId', operator: '==', value: userId }],
      { field: 'createdAt', direction: 'desc' },
      limit
    ) as Promise<Notification[]>;
  }
}


