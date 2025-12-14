import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  CreateNotificationData
} from '@/types/notification';

export interface NotificationTemplateData {
  [key: string]: any;
}

/**
 * Notification template functions
 * Each function generates title, message, and metadata for a specific notification type
 */
export class NotificationTemplates {
  /**
   * Generate notification data from template
   */
  static generate(
    type: NotificationType,
    userId: string,
    data: NotificationTemplateData
  ): CreateNotificationData {
    const template = this.getTemplate(type);
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    const { title, message, category, priority, actionUrl, actionLabel, metadata } = template(data);

    return {
      userId,
      type,
      category,
      priority: priority || 'medium',
      title,
      message,
      actionUrl,
      actionLabel,
      metadata,
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType
    };
  }

  /**
   * Get template function for notification type
   */
  private static getTemplate(type: NotificationType): ((data: NotificationTemplateData) => {
    title: string;
    message: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }) | null {
    const templates: Record<NotificationType, (data: NotificationTemplateData) => any> = {
      // Order notifications
      order_created: (data) => ({
        title: 'Order Placed',
        message: `Your order #${data.orderId?.substring(0, 8) || 'N/A'} has been placed successfully.`,
        category: 'success' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/orders/${data.orderId}`,
        actionLabel: 'View Order',
        metadata: { orderId: data.orderId, totalAmount: data.totalAmount }
      }),

      order_status_changed: (data) => ({
        title: `Order ${data.status?.replace('_', ' ')}`,
        message: `Your order #${data.orderId?.substring(0, 8) || 'N/A'} status has been updated to ${data.status}.`,
        category: 'info' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/orders/${data.orderId}`,
        actionLabel: 'View Order',
        metadata: { orderId: data.orderId, status: data.status }
      }),

      order_cancelled: (data) => ({
        title: 'Order Cancelled',
        message: `Your order #${data.orderId?.substring(0, 8) || 'N/A'} has been cancelled.`,
        category: 'warning' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/orders/${data.orderId}`,
        actionLabel: 'View Order',
        metadata: { orderId: data.orderId, reason: data.reason }
      }),

      order_payment_received: (data) => ({
        title: 'Payment Received',
        message: `Payment of ₱${data.amount?.toFixed(2) || '0.00'} has been received for order #${data.orderId?.substring(0, 8) || 'N/A'}.`,
        category: 'success' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/orders/${data.orderId}`,
        actionLabel: 'View Order',
        metadata: { orderId: data.orderId, amount: data.amount }
      }),

      order_payment_failed: (data) => ({
        title: 'Payment Failed',
        message: `Payment for order #${data.orderId?.substring(0, 8) || 'N/A'} has failed. Please try again.`,
        category: 'error' as NotificationCategory,
        priority: 'urgent' as NotificationPriority,
        actionUrl: `/orders/${data.orderId}`,
        actionLabel: 'Retry Payment',
        metadata: { orderId: data.orderId, error: data.error }
      }),

      // Customization notifications
      customization_request_created: (data) => ({
        title: 'New Customization Request',
        message: `A new customization request for ${data.productName || 'product'} is available.`,
        category: 'info' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/my-customizations?requestId=${data.requestId}`,
        actionLabel: 'View Request',
        metadata: { requestId: data.requestId, productName: data.productName }
      }),

      customization_designer_assigned: (data) => ({
        title: 'Designer Assigned',
        message: `${data.designerName || 'A designer'} has been assigned to your customization request.`,
        category: 'success' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/my-customizations?requestId=${data.requestId}`,
        actionLabel: 'View Request',
        metadata: { requestId: data.requestId, designerId: data.designerId, designerName: data.designerName }
      }),

      customization_design_completed: (data) => ({
        title: 'Design Ready for Review',
        message: `Your designer has completed the design for your customization request. Please review it.`,
        category: 'success' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/my-customizations?requestId=${data.requestId}`,
        actionLabel: 'Review Design',
        metadata: { requestId: data.requestId, designerId: data.designerId }
      }),

      customization_design_approved: (data) => ({
        title: 'Design Approved',
        message: `Your design has been approved by the customer. You can now proceed with production.`,
        category: 'success' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/dashboard/customizations?requestId=${data.requestId}`,
        actionLabel: 'View Request',
        metadata: { requestId: data.requestId, customerId: data.customerId }
      }),

      customization_design_rejected: (data) => ({
        title: 'Design Revision Requested',
        message: `The customer has requested revisions for your design. ${data.reason ? `Reason: ${data.reason}` : ''}`,
        category: 'warning' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/dashboard/customizations?requestId=${data.requestId}`,
        actionLabel: 'View Feedback',
        metadata: { requestId: data.requestId, reason: data.reason, customerId: data.customerId }
      }),

      customization_pricing_created: (data) => ({
        title: 'Pricing Agreement Available',
        message: `A pricing agreement has been created for your customization request. Please review and approve.`,
        category: 'info' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/my-customizations?requestId=${data.requestId}`,
        actionLabel: 'Review Pricing',
        metadata: { requestId: data.requestId, designFee: data.designFee }
      }),

      customization_payment_required: (data) => ({
        title: 'Payment Required',
        message: `Payment of ₱${data.amount?.toFixed(2) || '0.00'} is required for your customization request.`,
        category: 'warning' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: `/my-customizations?requestId=${data.requestId}`,
        actionLabel: 'Make Payment',
        metadata: { requestId: data.requestId, amount: data.amount }
      }),

      customization_request_cancelled: (data) => ({
        title: 'Customization Request Cancelled',
        message: `The customization request has been cancelled. ${data.reason ? `Reason: ${data.reason}` : ''}`,
        category: 'warning' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/my-customizations`,
        actionLabel: 'View Requests',
        metadata: { requestId: data.requestId, reason: data.reason }
      }),

      // Message notifications
      message_received: (data) => ({
        title: 'New Message',
        message: `${data.senderName || 'Someone'} sent you a message: ${data.preview || ''}`,
        category: 'info' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: data.conversationId ? `/dashboard/messages?conversation=${data.conversationId}` : '/dashboard/messages',
        actionLabel: 'View Message',
        metadata: { conversationId: data.conversationId, senderId: data.senderId, senderName: data.senderName }
      }),

      // Review notifications
      review_received: (data) => ({
        title: 'New Review',
        message: `You received a ${data.rating || 5}-star review${data.reviewType ? ` for your ${data.reviewType}` : ''}.`,
        category: 'success' as NotificationCategory,
        priority: 'low' as NotificationPriority,
        actionUrl: data.reviewId ? `/reviews/${data.reviewId}` : '/reviews',
        actionLabel: 'View Review',
        metadata: { reviewId: data.reviewId, rating: data.rating, reviewType: data.reviewType }
      }),

      review_reply_received: (data) => ({
        title: 'Review Reply',
        message: `${data.replierName || 'Someone'} replied to your review.`,
        category: 'info' as NotificationCategory,
        priority: 'low' as NotificationPriority,
        actionUrl: data.reviewId ? `/reviews/${data.reviewId}` : '/reviews',
        actionLabel: 'View Reply',
        metadata: { reviewId: data.reviewId, replierId: data.replierId, replierName: data.replierName }
      }),

      // Product notifications
      product_published: (data) => ({
        title: 'Product Published',
        message: `Your product "${data.productName || 'product'}" has been published successfully.`,
        category: 'success' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: `/products/${data.productId}`,
        actionLabel: 'View Product',
        metadata: { productId: data.productId, productName: data.productName }
      }),

      product_updated: (data) => ({
        title: 'Product Updated',
        message: `Your product "${data.productName || 'product'}" has been updated.`,
        category: 'info' as NotificationCategory,
        priority: 'low' as NotificationPriority,
        actionUrl: `/products/${data.productId}`,
        actionLabel: 'View Product',
        metadata: { productId: data.productId, productName: data.productName }
      }),

      // User notifications
      user_welcome: (data) => ({
        title: 'Welcome to Fabriqly!',
        message: `Welcome ${data.userName || 'there'}! We're excited to have you here. Start exploring our products and services.`,
        category: 'success' as NotificationCategory,
        priority: 'low' as NotificationPriority,
        actionUrl: '/explore',
        actionLabel: 'Explore',
        metadata: { userId: data.userId }
      }),

      user_verified: (data) => ({
        title: 'Account Verified',
        message: 'Your account has been verified successfully. You now have full access to all features.',
        category: 'success' as NotificationCategory,
        priority: 'medium' as NotificationPriority,
        actionUrl: '/profile',
        actionLabel: 'View Profile',
        metadata: { userId: data.userId }
      }),

      application_status_updated: (data) => ({
        title: `Application ${data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'}`,
        message: `Your ${data.applicationType || 'application'} has been ${data.status}. ${data.reason ? `Reason: ${data.reason}` : ''}`,
        category: data.status === 'approved' ? 'success' : data.status === 'rejected' ? 'error' : 'info' as NotificationCategory,
        priority: 'high' as NotificationPriority,
        actionUrl: '/my-applications',
        actionLabel: 'View Application',
        metadata: { applicationId: data.applicationId, applicationType: data.applicationType, status: data.status, reason: data.reason }
      }),

      profile_updated: (data) => ({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
        category: 'info' as NotificationCategory,
        priority: 'low' as NotificationPriority,
        actionUrl: '/profile',
        actionLabel: 'View Profile',
        metadata: { userId: data.userId }
      }),

      // System notifications
      system_announcement: (data) => ({
        title: data.title || 'System Announcement',
        message: data.message || 'There is a new system announcement.',
        category: 'info' as NotificationCategory,
        priority: data.priority || 'medium' as NotificationPriority,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        metadata: data.metadata || {}
      })
    };

    return templates[type] || null;
  }
}


