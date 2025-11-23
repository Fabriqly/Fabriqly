import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument } from './firebase';

export type NotificationType =
  | 'order_created'
  | 'order_status_changed'
  | 'order_cancelled'
  | 'order_payment_received'
  | 'order_payment_failed'
  | 'customization_request_created'
  | 'customization_designer_assigned'
  | 'customization_design_completed'
  | 'customization_design_approved'
  | 'customization_design_rejected'
  | 'customization_pricing_created'
  | 'customization_payment_required'
  | 'customization_request_cancelled'
  | 'message_received'
  | 'review_received'
  | 'review_reply_received'
  | 'product_published'
  | 'product_updated'
  | 'user_welcome'
  | 'user_verified'
  | 'application_status_updated'
  | 'profile_updated'
  | 'system_announcement';

export type NotificationCategory = 'info' | 'success' | 'warning' | 'error';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification extends BaseDocument {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  readAt?: Date | Timestamp;
  metadata?: Record<string, any>;
  relatedEntityId?: string; // e.g., orderId, customizationRequestId, etc.
  relatedEntityType?: string; // e.g., 'order', 'customization', 'message', etc.
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationPagination {
  limit?: number;
  offset?: number;
  lastId?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byCategory: Record<NotificationCategory, number>;
}


