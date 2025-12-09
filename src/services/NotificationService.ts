import { NotificationRepository } from '@/repositories/NotificationRepository';
import { UserRepository } from '@/repositories/UserRepository';
import {
  Notification,
  CreateNotificationData,
  NotificationFilters,
  NotificationPagination,
  NotificationType,
  NotificationStats
} from '@/types/notification';
import { NotificationTemplates, NotificationTemplateData } from './NotificationTemplates';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private userRepo: UserRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Create a single notification
   * @param data Notification data
   * @param bypassPreferences If true, skip user preferences check (for testing/admin use)
   */
  async createNotification(data: CreateNotificationData, bypassPreferences: boolean = false): Promise<Notification> {
    // Check user preferences (default to enabled if not set)
    if (!bypassPreferences) {
      const shouldCreate = await this.shouldCreateNotification(data.userId, data.type);
      if (!shouldCreate) {
        throw new Error('Notification creation disabled by user preferences');
      }
    }

    const notificationData = {
      ...data,
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    return this.notificationRepo.create(notificationData);
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  async createNotificationsForUsers(
    userIds: string[],
    type: NotificationType,
    templateData: NotificationTemplateData
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      try {
        // Check user preferences
        const shouldCreate = await this.shouldCreateNotification(userId, type);
        if (!shouldCreate) {
          continue;
        }

        // Generate notification data from template
        const notificationData = NotificationTemplates.generate(type, userId, templateData);
        const notification = await this.createNotification(notificationData);
        notifications.push(notification);
      } catch (error) {
        // Log error but continue with other users
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }

    return notifications;
  }

  /**
   * Send notification using template (main entry point)
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    templateData: NotificationTemplateData
  ): Promise<Notification> {
    const notificationData = NotificationTemplates.generate(type, userId, templateData);
    return this.createNotification(notificationData);
  }

  /**
   * Get user notifications with filters and pagination
   */
  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters,
    pagination?: NotificationPagination
  ): Promise<Notification[]> {
    return this.notificationRepo.findByUserId(userId, filters, pagination);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return this.notificationRepo.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    return this.notificationRepo.markAllAsRead(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // Verify ownership
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw AppError.notFound('Notification not found');
    }
    if (notification.userId !== userId) {
      throw AppError.forbidden('Unauthorized: Notification does not belong to user');
    }

    return this.notificationRepo.delete(notificationId);
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      return null;
    }
    if (notification.userId !== userId) {
      throw AppError.forbidden('Unauthorized: Notification does not belong to user');
    }
    return notification;
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const allNotifications = await this.notificationRepo.findByUserId(userId);
    const unreadNotifications = allNotifications.filter(n => !n.isRead);

    const stats: NotificationStats = {
      total: allNotifications.length,
      unread: unreadNotifications.length,
      byType: {} as Record<NotificationType, number>,
      byCategory: {
        info: 0,
        success: 0,
        warning: 0,
        error: 0
      }
    };

    // Count by type
    allNotifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Cleanup old notifications (older than specified days)
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 90): Promise<void> {
    return this.notificationRepo.deleteOldNotifications(userId, daysOld);
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    return this.notificationRepo.getRecentNotifications(userId, limit);
  }

  /**
   * Check if notification should be created based on user preferences
   */
  private async shouldCreateNotification(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const user = await this.userRepo.findById(userId);
      if (!user) {
        return false; // User doesn't exist
      }

      // Default to enabled if preferences not set
      const preferences = user.profile?.preferences?.notifications;
      if (!preferences) {
        return true; // Default to enabled
      }

      // Check if push notifications are enabled (for in-app notifications)
      // Email and SMS preferences are for external notifications
      return preferences.push !== false; // Default to true if not set
    } catch (error) {
      console.error('Error checking user preferences:', error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Get notifications by related entity
   */
  async getNotificationsByRelatedEntity(
    userId: string,
    relatedEntityType: string,
    relatedEntityId: string
  ): Promise<Notification[]> {
    return this.notificationRepo.findByRelatedEntity(userId, relatedEntityType, relatedEntityId);
  }
}

