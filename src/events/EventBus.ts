import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

export interface Event {
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler<T = any> {
  (event: Event & { data: T }): Promise<void> | void;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  priority: number;
  once: boolean;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventSubscription[]> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;
  private isEnabled = true;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type
   */
  on<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options: {
      priority?: number;
      once?: boolean;
    } = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      priority: options.priority || 0,
      once: options.once || false
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.push(subscription);
    
    // Sort by priority (higher priority first)
    eventListeners.sort((a, b) => b.priority - a.priority);

    return subscriptionId;
  }

  /**
   * Subscribe to an event type (once only)
   */
  once<T = any>(eventType: string, handler: EventHandler<T>): string {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: string, subscriptionId: string): boolean {
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) {
      return false;
    }

    const index = eventListeners.findIndex(sub => sub.id === subscriptionId);
    if (index === -1) {
      return false;
    }

    eventListeners.splice(index, 1);
    
    // Remove event type if no listeners
    if (eventListeners.length === 0) {
      this.listeners.delete(eventType);
    }

    return true;
  }

  /**
   * Emit an event
   */
  async emit(eventType: string, data: any, source?: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const event: Event = {
      type: eventType,
      data,
      timestamp: new Date(),
      source,
      metadata
    };

    // Add to history
    this.addToHistory(event);

    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }

    // Execute handlers
    const handlersToRemove: string[] = [];

    for (const subscription of eventListeners) {
      try {
        await PerformanceMonitor.measure(
          `event.${eventType}.${subscription.id}`,
          async () => {
            const result = subscription.handler(event);
            if (result instanceof Promise) {
              await result;
            }
          },
          { eventType, subscriptionId: subscription.id }
        );

        // Remove if it's a once subscription
        if (subscription.once) {
          handlersToRemove.push(subscription.id);
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
        
        // Emit error event
        await this.emit('event.error', {
          eventType,
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'EventBus');
      }
    }

    // Remove once handlers
    for (const id of handlersToRemove) {
      this.off(eventType, id);
    }
  }

  /**
   * Emit an event synchronously
   */
  emitSync(eventType: string, data: any, source?: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) {
      return;
    }

    const event: Event = {
      type: eventType,
      data,
      timestamp: new Date(),
      source,
      metadata
    };

    // Add to history
    this.addToHistory(event);

    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }

    // Execute handlers synchronously
    const handlersToRemove: string[] = [];

    for (const subscription of eventListeners) {
      try {
        PerformanceMonitor.measureSync(
          `event.${eventType}.${subscription.id}`,
          () => subscription.handler(event),
          { eventType, subscriptionId: subscription.id }
        );

        // Remove if it's a once subscription
        if (subscription.once) {
          handlersToRemove.push(subscription.id);
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }

    // Remove once handlers
    for (const id of handlersToRemove) {
      this.off(eventType, id);
    }
  }

  /**
   * Get all event types with listeners
   */
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listeners for a specific event type
   */
  getListeners(eventType: string): EventSubscription[] {
    return this.listeners.get(eventType) || [];
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): Event[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Enable or disable the event bus
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if event bus is enabled
   */
  isEventBusEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Remove all listeners for an event type or all listeners
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get statistics about the event bus
   */
  getStats(): {
    totalEventTypes: number;
    totalListeners: number;
    totalEvents: number;
    eventTypes: Array<{
      type: string;
      listenerCount: number;
      lastEmitted?: Date;
    }>;
  } {
    const eventTypes = Array.from(this.listeners.keys()).map(type => {
      const listeners = this.listeners.get(type) || [];
      const eventsOfType = this.eventHistory.filter(e => e.type === type);
      const lastEmitted = eventsOfType.length > 0 
        ? eventsOfType[eventsOfType.length - 1].timestamp 
        : undefined;

      return {
        type,
        listenerCount: listeners.length,
        lastEmitted
      };
    });

    return {
      totalEventTypes: this.listeners.size,
      totalListeners: Array.from(this.listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0),
      totalEvents: this.eventHistory.length,
      eventTypes
    };
  }

  /**
   * Add event to history
   */
  private addToHistory(event: Event): void {
    this.eventHistory.push(event);

    // Keep only the last maxHistorySize events
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global event bus instance
export const eventBus = EventBus.getInstance();

// Event type constants
export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_VERIFIED: 'user.verified',

  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_PUBLISHED: 'product.published',

  // Category events
  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',

  // Activity events
  ACTIVITY_CREATED: 'activity.created',
  ACTIVITY_UPDATED: 'activity.updated',

  // System events
  CACHE_INVALIDATED: 'cache.invalidated',
  PERFORMANCE_WARNING: 'performance.warning',
  ERROR_OCCURRED: 'error.occurred',

  // Event bus events
  EVENT_ERROR: 'event.error'
} as const;
