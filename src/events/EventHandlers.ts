import { eventBus, EventTypes } from './EventBus';
import { CacheService } from '@/services/CacheService';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

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
      console.log('User registered:', {
        userId: event.data.id,
        email: event.data.email,
        role: event.data.role,
        timestamp: event.timestamp
      });
    });

    // Track product creations
    eventBus.on(EventTypes.PRODUCT_CREATED, (event) => {
      console.log('Product created:', {
        productId: event.data.id,
        businessOwnerId: event.data.businessOwnerId,
        categoryId: event.data.categoryId,
        timestamp: event.timestamp
      });
    });

    // Track category changes
    eventBus.on(EventTypes.CATEGORY_CREATED, (event) => {
      console.log('Category created:', {
        categoryId: event.data.id,
        name: event.data.name,
        parentId: event.data.parentId,
        timestamp: event.timestamp
      });
    });
  }
}

/**
 * Notification event handlers
 */
export class NotificationEventHandlers {
  static initialize(): void {
    // Send welcome email when user is created
    eventBus.on(EventTypes.USER_CREATED, async (event) => {
      try {
        // In a real implementation, you would send an email here
        console.log('Sending welcome email to:', event.data.email);
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Welcome email sent successfully');
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    });

    // Send notification when product is published
    eventBus.on(EventTypes.PRODUCT_PUBLISHED, async (event) => {
      try {
        console.log('Product published notification:', {
          productId: event.data.id,
          productName: event.data.name,
          businessOwnerId: event.data.businessOwnerId
        });
        
        // In a real implementation, you would send notifications here
        // - Email to business owner
        // - Push notification to followers
        // - Update search index
      } catch (error) {
        console.error('Failed to send product published notification:', error);
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
      console.warn('Performance warning:', {
        operation: event.data.operation,
        duration: event.data.duration,
        threshold: event.data.threshold,
        timestamp: event.timestamp
      });
    });

    // Track errors
    eventBus.on(EventTypes.ERROR_OCCURRED, (event) => {
      console.error('Error occurred:', {
        error: event.data.error,
        operation: event.data.operation,
        context: event.data.context,
        timestamp: event.timestamp
      });
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
        console.log('Updating search index for product:', event.data.id);
        
        // In a real implementation, you would update your search index here
        // - Add to Elasticsearch
        // - Update Algolia index
        // - Update internal search cache
        
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('Search index updated successfully');
      } catch (error) {
        console.error('Failed to update search index:', error);
      }
    });

    eventBus.on(EventTypes.PRODUCT_UPDATED, async (event) => {
      try {
        console.log('Updating search index for updated product:', event.data.id);
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('Search index updated successfully');
      } catch (error) {
        console.error('Failed to update search index:', error);
      }
    });

    // Remove from search index when product is deleted
    eventBus.on(EventTypes.PRODUCT_DELETED, async (event) => {
      try {
        console.log('Removing from search index:', event.data.id);
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('Removed from search index successfully');
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
    // Log all user-related events
    eventBus.on(EventTypes.USER_CREATED, (event) => {
      console.log('AUDIT: User created', {
        userId: event.data.id,
        email: event.data.email,
        role: event.data.role,
        timestamp: event.timestamp
      });
    });

    eventBus.on(EventTypes.USER_UPDATED, (event) => {
      console.log('AUDIT: User updated', {
        userId: event.data.id,
        changes: event.data.changes,
        timestamp: event.timestamp
      });
    });

    eventBus.on(EventTypes.USER_DELETED, (event) => {
      console.log('AUDIT: User deleted', {
        userId: event.data.id,
        timestamp: event.timestamp
      });
    });

    // Log all product-related events
    eventBus.on(EventTypes.PRODUCT_CREATED, (event) => {
      console.log('AUDIT: Product created', {
        productId: event.data.id,
        businessOwnerId: event.data.businessOwnerId,
        timestamp: event.timestamp
      });
    });

    eventBus.on(EventTypes.PRODUCT_UPDATED, (event) => {
      console.log('AUDIT: Product updated', {
        productId: event.data.id,
        changes: event.data.changes,
        timestamp: event.timestamp
      });
    });

    eventBus.on(EventTypes.PRODUCT_DELETED, (event) => {
      console.log('AUDIT: Product deleted', {
        productId: event.data.id,
        businessOwnerId: event.data.businessOwnerId,
        timestamp: event.timestamp
      });
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

  console.log('Event handlers initialized successfully');
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
