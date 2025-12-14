import { eventBus, EventTypes } from './EventBus';
import { CacheService } from '@/services/CacheService';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';
import { NotificationService } from '@/services/NotificationService';
import { UserRepository } from '@/repositories/UserRepository';

/**
 * Cache invalidation event handlers
 */
export class CacheEventHandlers {
  static initialize(): void {
    // Invalidate product cache when product is created/updated/deleted
    eventBus.on(EventTypes.PRODUCT_CREATED, () => {
      CacheService.invalidate('products');
    });

    eventBus.on(EventTypes.PRODUCT_UPDATED, () => {
      CacheService.invalidate('products');
    });

    eventBus.on(EventTypes.PRODUCT_DELETED, () => {
      CacheService.invalidate('products');
    });

    // Invalidate category cache when category is created/updated/deleted
    eventBus.on(EventTypes.CATEGORY_CREATED, () => {
      CacheService.invalidate('categories');
    });

    eventBus.on(EventTypes.CATEGORY_UPDATED, () => {
      CacheService.invalidate('categories');
    });

    eventBus.on(EventTypes.CATEGORY_DELETED, () => {
      CacheService.invalidate('categories');
    });

    // Invalidate user cache when user is created/updated/deleted
    eventBus.on(EventTypes.USER_CREATED, () => {
      CacheService.invalidate('users');
    });

    eventBus.on(EventTypes.USER_UPDATED, () => {
      CacheService.invalidate('users');
    });

    eventBus.on(EventTypes.USER_DELETED, () => {
      CacheService.invalidate('users');
    });
  }
}

/**
 * Analytics event handlers
 */
export class AnalyticsEventHandlers {
  static initialize(): void {
    // Track user registrations
    eventBus.on(EventTypes.USER_CREATED, (event) => {
      // Analytics tracking
    });

    // Track product creations
    eventBus.on(EventTypes.PRODUCT_CREATED, (event) => {
      // Analytics tracking
    });

    // Track category changes
    eventBus.on(EventTypes.CATEGORY_CREATED, (event) => {
      // Analytics tracking
    });
  }
}

/**
 * Notification event handlers
 */
export class NotificationEventHandlers {
  private static notificationService = new NotificationService();
  private static userRepo = new UserRepository();

  static initialize(): void {
    // ===== USER NOTIFICATIONS =====

    // Send welcome notification when user is created
    eventBus.on(EventTypes.USER_CREATED, async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.id,
          'user_welcome',
          {
            userId: event.data.id,
            userName: event.data.displayName || event.data.email,
            relatedEntityId: event.data.id,
            relatedEntityType: 'user'
          }
        );
      } catch (error) {
        console.error('Failed to send welcome notification:', error);
      }
    });

    // Send notification when user is verified
    eventBus.on(EventTypes.USER_VERIFIED, async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.userId || event.data.id,
          'user_verified',
          {
            userId: event.data.userId || event.data.id,
            relatedEntityId: event.data.userId || event.data.id,
            relatedEntityType: 'user'
          }
        );
      } catch (error) {
        console.error('Failed to send verification notification:', error);
      }
    });

    // ===== PRODUCT NOTIFICATIONS =====

    // Send notification when product is published
    eventBus.on(EventTypes.PRODUCT_PUBLISHED, async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.businessOwnerId,
          'product_published',
          {
            productId: event.data.id,
            productName: event.data.name,
            businessOwnerId: event.data.businessOwnerId,
            relatedEntityId: event.data.id,
            relatedEntityType: 'product'
          }
        );
      } catch (error) {
        console.error('Failed to send product published notification:', error);
      }
    });

    // Send notification when product is updated
    eventBus.on(EventTypes.PRODUCT_UPDATED, async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.businessOwnerId,
          'product_updated',
          {
            productId: event.data.id,
            productName: event.data.name,
            businessOwnerId: event.data.businessOwnerId,
            relatedEntityId: event.data.id,
            relatedEntityType: 'product'
          }
        );
      } catch (error) {
        console.error('Failed to send product updated notification:', error);
      }
    });

    // ===== ORDER NOTIFICATIONS =====

    // Notify customer when order is created
    eventBus.on('order.created', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.customerId,
          'order_created',
          {
            orderId: event.data.orderId,
            totalAmount: event.data.totalAmount,
            relatedEntityId: event.data.orderId,
            relatedEntityType: 'order'
          }
        );
      } catch (error) {
        console.error('Failed to send order created notification:', error);
      }
    });

    // Notify customer when order status changes
    eventBus.on('order.updated', async (event) => {
      try {
        if (event.data.changes?.status) {
          await this.notificationService.sendNotification(
            event.data.customerId,
            'order_status_changed',
            {
              orderId: event.data.orderId,
              status: event.data.changes.status,
              relatedEntityId: event.data.orderId,
              relatedEntityType: 'order'
            }
          );
        }
      } catch (error) {
        console.error('Failed to send order updated notification:', error);
      }
    });

    // ===== CUSTOMIZATION SYSTEM NOTIFICATIONS =====

    // Notify designers when new customization request is created
    eventBus.on('customization.request.created', async (event) => {
      try {
        // Get all designers
        const designers = await this.userRepo.findByRole('designer');
        const designerIds = designers.map(d => d.id);

        if (designerIds.length > 0) {
          await this.notificationService.createNotificationsForUsers(
            designerIds,
            'customization_request_created',
            {
              requestId: event.data.requestId,
              productName: event.data.productName,
              customerId: event.data.customerId,
              relatedEntityId: event.data.requestId,
              relatedEntityType: 'customization'
            }
          );
        }
      } catch (error) {
        console.error('Failed to send new request notification:', error);
      }
    });

    // Notify customer when designer is assigned
    eventBus.on('customization.designer.assigned', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.customerId,
          'customization_designer_assigned',
          {
            requestId: event.data.requestId,
            designerId: event.data.designerId,
            designerName: event.data.designerName,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );
      } catch (error) {
        console.error('Failed to send designer assigned notification:', error);
      }
    });

    // Notify customer when designer completes work
    eventBus.on('customization.design.completed', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.customerId,
          'customization_design_completed',
          {
            requestId: event.data.requestId,
            designerId: event.data.designerId,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );
      } catch (error) {
        console.error('Failed to send design completed notification:', error);
      }
    });

    // Notify designer when customer approves design
    eventBus.on('customization.design.approved', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.designerId,
          'customization_design_approved',
          {
            requestId: event.data.requestId,
            customerId: event.data.customerId,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );
      } catch (error) {
        console.error('Failed to send design approved notification:', error);
      }
    });

    // Notify designer when customer rejects design
    eventBus.on('customization.design.rejected', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.designerId,
          'customization_design_rejected',
          {
            requestId: event.data.requestId,
            reason: event.data.reason,
            customerId: event.data.customerId,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );
      } catch (error) {
        console.error('Failed to send design rejected notification:', error);
      }
    });

    // Notify customer when pricing is created
    eventBus.on('customization.pricing.created', async (event) => {
      try {
        await this.notificationService.sendNotification(
          event.data.customerId,
          'customization_pricing_created',
          {
            requestId: event.data.requestId,
            designFee: event.data.designFee,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );
      } catch (error) {
        console.error('Failed to send pricing created notification:', error);
      }
    });

    // Notify customer when payment is required
    eventBus.on('customization.payment.updated', async (event) => {
      try {
        if (event.data.remainingAmount > 0) {
          await this.notificationService.sendNotification(
            event.data.customerId,
            'customization_payment_required',
            {
              requestId: event.data.requestId,
              amount: event.data.remainingAmount,
              relatedEntityId: event.data.requestId,
              relatedEntityType: 'customization'
            }
          );
        }
      } catch (error) {
        console.error('Failed to send payment required notification:', error);
      }
    });

    // Notify relevant parties when request is cancelled
    eventBus.on('customization.request.cancelled', async (event) => {
      try {
        // Notify customer
        await this.notificationService.sendNotification(
          event.data.customerId,
          'customization_request_cancelled',
          {
            requestId: event.data.requestId,
            reason: event.data.reason,
            relatedEntityId: event.data.requestId,
            relatedEntityType: 'customization'
          }
        );

        // Notify designer if assigned
        if (event.data.designerId) {
          await this.notificationService.sendNotification(
            event.data.designerId,
            'customization_request_cancelled',
            {
              requestId: event.data.requestId,
              reason: event.data.reason,
              relatedEntityId: event.data.requestId,
              relatedEntityType: 'customization'
            }
          );
        }
      } catch (error) {
        console.error('Failed to send cancellation notification:', error);
      }
    });

    // ===== MESSAGE NOTIFICATIONS =====

    // NOTE: message notifications are created directly in `POST /api/messages`
    // so we do not duplicate them here.

    // ===== REVIEW NOTIFICATIONS =====

    // Notify when review is created
    eventBus.on('review.created', async (event) => {
      try {
        // Determine target user based on review type
        let targetUserId: string | undefined;
        if (event.data.reviewType === 'shop' && event.data.shopId) {
          // Get shop owner
          // This would need shop repository - for now, skip
        } else if (event.data.reviewType === 'designer' && event.data.designerId) {
          targetUserId = event.data.designerId;
        } else if (event.data.reviewType === 'product' && event.data.productId) {
          // Get product owner
          // This would need product repository - for now, skip
        }

        if (targetUserId) {
          await this.notificationService.sendNotification(
            targetUserId,
            'review_received',
            {
              reviewId: event.data.reviewId,
              rating: event.data.rating,
              reviewType: event.data.reviewType,
              relatedEntityId: event.data.reviewId,
              relatedEntityType: 'review'
            }
          );
        }
      } catch (error) {
        console.error('Failed to send review notification:', error);
      }
    });
  }
}

/**
 * Performance monitoring event handlers
 */
export class PerformanceEventHandlers {
  static initialize(): void {
    // Monitor slow operations
    eventBus.on(EventTypes.PERFORMANCE_WARNING, (event) => {
      // Performance monitoring
    });

    // Track errors
    eventBus.on(EventTypes.ERROR_OCCURRED, (event) => {
      // Error tracking
    });
  }
}

/**
 * Search index event handlers
 */
export class SearchIndexEventHandlers {
  static initialize(): void {
    // Update search index when product is created/updated
    eventBus.on(EventTypes.PRODUCT_CREATED, async (event) => {
      try {
        // In a real implementation, you would update your search index here
        // - Add to Elasticsearch
        // - Update Algolia index
        // - Update internal search cache
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('Failed to update search index:', error);
      }
    });

    eventBus.on(EventTypes.PRODUCT_UPDATED, async (event) => {
      try {
        // Update search index
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('Failed to update search index:', error);
      }
    });

    // Remove from search index when product is deleted
    eventBus.on(EventTypes.PRODUCT_DELETED, async (event) => {
      try {
        // Remove from search index
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error('Failed to remove from search index:', error);
      }
    });
  }
}

/**
 * Audit log event handlers
 */
export class AuditLogEventHandlers {
  static initialize(): void {
    // Log all user-related events (audit logging)
    eventBus.on(EventTypes.USER_CREATED, (event) => {
      // Audit log: User created
    });

    eventBus.on(EventTypes.USER_UPDATED, (event) => {
      // Audit log: User updated
    });

    eventBus.on(EventTypes.USER_DELETED, (event) => {
      // Audit log: User deleted
    });

    // Log all product-related events (audit logging)
    eventBus.on(EventTypes.PRODUCT_CREATED, (event) => {
      // Audit log: Product created
    });

    eventBus.on(EventTypes.PRODUCT_UPDATED, (event) => {
      // Audit log: Product updated
    });

    eventBus.on(EventTypes.PRODUCT_DELETED, (event) => {
      // Audit log: Product deleted
    });
  }
}

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers(): void {
  CacheEventHandlers.initialize();
  AnalyticsEventHandlers.initialize();
  NotificationEventHandlers.initialize();
  PerformanceEventHandlers.initialize();
  SearchIndexEventHandlers.initialize();
  AuditLogEventHandlers.initialize();

  // Event handlers initialized
}

/**
 * Event handler decorator for automatic event emission
 */
export function EmitEvent(eventType: string, getData?: (result: any, args: any[]) => any) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      // Emit event with result data
      const eventData = getData ? getData(result, args) : result;
      await eventBus.emit(eventType, eventData, `${target.constructor.name}.${propertyName}`);
      
      return result;
    };

    return descriptor;
  };
}

