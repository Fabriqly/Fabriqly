import { OrderRepository, OrderFilters, OrderStats as RepositoryOrderStats } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { Order } from '@/types/firebase';

import { ActivityType } from '@/types/activity';
import { Timestamp } from 'firebase/firestore';

import { 
  IOrderService, 
  CreateOrderData, 
  UpdateOrderData, 
  OrderSearchOptions, 
  OrderSearchResult, 
  OrderStats, 
  OrderValidationResult,
  OrderItem,
  Address
} from '@/services/interfaces/IOrderService';
import { AppError } from '@/errors/AppError';
import { CacheService } from '@/services/CacheService';
import { eventBus, EventTypes } from '@/events';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

export class OrderService implements IOrderService {
  constructor(
    private orderRepository: OrderRepository,
    private activityRepository: ActivityRepository,
    private productRepository: ProductRepository,
    private cacheService: CacheService
  ) {}

  async createOrder(data: CreateOrderData): Promise<Order> {
    return PerformanceMonitor.measure('OrderService.createOrder', async () => {
      // Validate order data
      const validation = await this.validateOrderData(data);
      if (!validation.isValid) {
        throw AppError.badRequest('Invalid order data', validation.errors);
      }

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08; // 8% tax
      const shipping = data.shippingCost || 0;
      const totalAmount = subtotal + tax + shipping;

      // Create order
      const orderData = {
        customerId: data.customerId,
        businessOwnerId: data.businessOwnerId,
        items: data.items,
        subtotal,
        tax,
        shippingCost: shipping,
        totalAmount,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const order = await this.orderRepository.create(orderData);

      // Log activity
      await this.activityRepository.create({
        type: 'order_created',
        title: 'Order Created',
        description: `New order #${order.id} created`,
        priority: 'high',
        status: 'active',
        targetId: order.id,
        actorId: data.customerId,
        metadata: {
          orderId: order.id,
          totalAmount: order.totalAmount,
          itemCount: data.items.length
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Emit event
      eventBus.emit('order.created', {
        orderId: order.id,
        customerId: data.customerId,
        businessOwnerId: data.businessOwnerId,
        totalAmount: order.totalAmount
      });

      // Clear relevant caches
      await CacheService.invalidate(`orders:customer:${data.customerId}`);
      await CacheService.invalidate(`orders:business:${data.businessOwnerId}`);

      return order;
    });
  }

  async updateOrder(orderId: string, data: UpdateOrderData, userId: string): Promise<Order> {
    return PerformanceMonitor.measure('OrderService.updateOrder', async () => {
      // Get existing order
      const existingOrder = await this.orderRepository.findById(orderId);
      if (!existingOrder) {
        throw AppError.notFound('Order not found');
      }

      // Check permissions
      const canUpdate = this.canUserUpdateOrder(existingOrder, userId);
      if (!canUpdate) {
        throw AppError.forbidden('Insufficient permissions to update this order');
      }

      // Validate update data
      const validation = await this.validateOrderUpdate(data);
      if (!validation.isValid) {
        throw AppError.badRequest('Invalid update data', validation.errors);
      }

      // Validate status transitions
      if (data.status && !this.canUpdateStatus(existingOrder.status, data.status)) {
        throw AppError.badRequest(`Invalid status transition from ${existingOrder.status} to ${data.status}`);
      }

      // Update order
      const updatedOrder = await this.orderRepository.update(orderId, {
        ...data,
        updatedAt: Timestamp.now()
      });

      // Log activity
      await this.activityRepository.create({
        type: 'order_updated',
        title: 'Order Updated',
        description: `Order #${orderId} has been updated`,
        priority: 'medium',
        status: 'active',
        targetId: orderId,
        actorId: userId,
        metadata: {
          orderId,
          changes: data,
          previousStatus: existingOrder.status
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Emit event
      eventBus.emit('order.updated', {
        orderId,
        changes: data,
        customerId: existingOrder.customerId,
        businessOwnerId: existingOrder.businessOwnerId
      });

      // Clear relevant caches
      await CacheService.invalidate(`order:${orderId}`);
      await CacheService.invalidate(`orders:customer:${existingOrder.customerId}`);
      await CacheService.invalidate(`orders:business:${existingOrder.businessOwnerId}`);

      return updatedOrder;
    });
  }

  async deleteOrder(orderId: string, userId: string): Promise<void> {
    return PerformanceMonitor.measure('OrderService.deleteOrder', async () => {
      // Get existing order
      const existingOrder = await this.orderRepository.findById(orderId);
      if (!existingOrder) {
        throw AppError.notFound('Order not found');
      }

      // Check permissions
      const canDelete = this.canUserDeleteOrder(existingOrder, userId);
      if (!canDelete) {
        throw AppError.forbidden('Insufficient permissions to delete this order');
      }

      // Only allow deletion of pending orders
      if (existingOrder.status !== 'pending') {
        throw AppError.badRequest('Only pending orders can be deleted');
      }

      // Delete order
      await this.orderRepository.delete(orderId);

      // Log activity
      await this.activityRepository.create({
        type: 'order_cancelled',
        title: 'Order Deleted',
        description: `Order #${orderId} has been deleted`,
        priority: 'high',
        status: 'active',
        targetId: orderId,
        actorId: userId,
        metadata: {
          orderId,
          previousStatus: existingOrder.status
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Emit event
      eventBus.emit('order.deleted', {
        orderId,
        customerId: existingOrder.customerId,
        businessOwnerId: existingOrder.businessOwnerId
      });

      // Clear relevant caches
      await CacheService.invalidate(`order:${orderId}`);
      await CacheService.invalidate(`orders:customer:${existingOrder.customerId}`);
      await CacheService.invalidate(`orders:business:${existingOrder.businessOwnerId}`);
    });
  }

  async getOrder(orderId: string, userId: string): Promise<Order | null> {
    return PerformanceMonitor.measure('OrderService.getOrder', async () => {
      // Check cache first
      const cacheKey = `order:${orderId}`;
      const cachedOrder = await CacheService.get<Order>(cacheKey);
      if (cachedOrder) {
        // Check permissions for cached order
        if (this.canUserViewOrder(cachedOrder, userId)) {
          return cachedOrder;
        }
      }

      // Get order from repository
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return null;
      }

      // Check permissions
      if (!this.canUserViewOrder(order, userId)) {
        throw AppError.forbidden('Insufficient permissions to view this order');
      }

      // Cache the order
      CacheService.set(cacheKey, order, 300); // 5 minutes

      return order;
    });
  }

  async getOrders(options: OrderSearchOptions, userId: string): Promise<OrderSearchResult> {
    return PerformanceMonitor.measure('OrderService.getOrders', async () => {
      // Convert options to repository filters
      const filters: OrderFilters = {
        customerId: options.customerId,
        businessOwnerId: options.businessOwnerId,
        status: options.status,
        paymentStatus: options.paymentStatus,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        minAmount: options.minAmount,
        maxAmount: options.maxAmount
      };

      // Get orders from repository
      const orders = await this.orderRepository.findWithFilters(
        filters,
        options.sortBy,
        options.sortOrder,
        options.limit
      );

      // Filter orders based on user permissions
      const filteredOrders = orders.filter(order => this.canUserViewOrder(order, userId));

      // Calculate totals
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        orders: filteredOrders,
        total: filteredOrders.length,
        totalRevenue,
        hasMore: filteredOrders.length === (options.limit || 50)
      };
    });
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled', userId: string): Promise<Order> {
    return this.updateOrder(orderId, { status }, userId);
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded', userId: string): Promise<Order> {
    return this.updateOrder(orderId, { paymentStatus }, userId);
  }

  async addTrackingNumber(orderId: string, trackingNumber: string, carrier?: string, userId?: string): Promise<Order> {
    const updateData: UpdateOrderData = { 
      trackingNumber, 
      status: 'shipped' 
    };
    
    if (carrier) {
      updateData.carrier = carrier;
    }

    return this.updateOrder(orderId, updateData, userId || 'system');
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'cancelled', userId);
  }

  async getCustomerOrders(customerId: string, options?: OrderSearchOptions): Promise<OrderSearchResult> {
    return this.getOrders({ ...options, customerId }, customerId);
  }

  async getCustomerOrderStats(customerId: string): Promise<OrderStats> {
    const stats = await this.orderRepository.getOrderStats({ customerId });
    return this.convertRepositoryStats(stats);
  }

  async getBusinessOwnerOrders(businessOwnerId: string, options?: OrderSearchOptions): Promise<OrderSearchResult> {
    return this.getOrders({ ...options, businessOwnerId }, businessOwnerId);
  }

  async getBusinessOwnerOrderStats(businessOwnerId: string): Promise<OrderStats> {
    const stats = await this.orderRepository.getOrderStats({ businessOwnerId });
    return this.convertRepositoryStats(stats);
  }

  async getAllOrders(options?: OrderSearchOptions): Promise<OrderSearchResult> {
    return this.getOrders(options || {}, 'admin');
  }

  async getOrderStats(filters?: OrderSearchOptions): Promise<OrderStats> {
    const repositoryFilters: OrderFilters = {
      customerId: filters?.customerId,
      businessOwnerId: filters?.businessOwnerId,
      status: filters?.status,
      paymentStatus: filters?.paymentStatus,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      minAmount: filters?.minAmount,
      maxAmount: filters?.maxAmount
    };

    const stats = await this.orderRepository.getOrderStats(repositoryFilters);
    return this.convertRepositoryStats(stats);
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return this.orderRepository.getRecentOrders(limit);
  }

  async validateOrderData(data: CreateOrderData): Promise<OrderValidationResult> {
    const errors: string[] = [];

    if (!data.customerId) {
      errors.push('Customer ID is required');
    }

    if (!data.businessOwnerId) {
      errors.push('Business owner ID is required');
    }

    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (data.items) {
      // Validate stock availability for each item
      for (let index = 0; index < data.items.length; index++) {
        const item = data.items[index];
        
        if (!item.productId) {
          errors.push(`Item ${index + 1}: Product ID is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Valid quantity is required`);
        }
        if (!item.price || item.price < 0) {
          errors.push(`Item ${index + 1}: Valid price is required`);
        }

        // Check stock availability and product status
        if (item.productId && item.quantity > 0) {
          try {
            const product = await this.productRepository.findById(item.productId);
            if (!product) {
              errors.push(`Item ${index + 1}: Product not found`);
            } else if (product.status !== 'active') {
              errors.push(`Item ${index + 1}: "${product.name}" is no longer available (product is ${product.status})`);
            } else if (product.stockQuantity < item.quantity) {
              errors.push(`Item ${index + 1}: "${product.name}" is out of stock. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
            }
          } catch (error) {
            console.error(`Error checking product ${item.productId}:`, error);
            errors.push(`Item ${index + 1}: Unable to verify product availability`);
          }
        }
      }
    }

    if (!data.shippingAddress) {
      errors.push('Shipping address is required');
    } else {
      const addressErrors = this.validateAddress(data.shippingAddress);
      errors.push(...addressErrors.map(error => `Shipping address: ${error}`));
    }

    if (data.billingAddress) {
      const addressErrors = this.validateAddress(data.billingAddress);
      errors.push(...addressErrors.map(error => `Billing address: ${error}`));
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateOrderUpdate(data: UpdateOrderData): Promise<OrderValidationResult> {
    const errors: string[] = [];

    if (data.status && !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(data.status)) {
      errors.push('Invalid status value');
    }

    if (data.paymentStatus && !['pending', 'paid', 'failed', 'refunded'].includes(data.paymentStatus)) {
      errors.push('Invalid payment status value');
    }

    if (data.trackingNumber && typeof data.trackingNumber !== 'string') {
      errors.push('Tracking number must be a string');
    }

    if (data.notes && typeof data.notes !== 'string') {
      errors.push('Notes must be a string');
    }

    if (data.carrier && typeof data.carrier !== 'string') {
      errors.push('Carrier must be a string');
    }

    if (data.estimatedDelivery && !(data.estimatedDelivery instanceof Date)) {
      errors.push('Estimated delivery must be a valid date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  canUpdateStatus(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getValidStatusTransitions(currentStatus: string): string[] {
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    return validTransitions[currentStatus] || [];
  }

  async getOrdersByProduct(productId: string): Promise<Order[]> {
    return this.orderRepository.getOrdersByProduct(productId);
  }

  async getOrdersByDateRange(dateFrom: Date, dateTo: Date): Promise<Order[]> {
    return this.orderRepository.findByDateRange(dateFrom, dateTo);
  }

  async getOrdersByAmountRange(minAmount: number, maxAmount: number): Promise<Order[]> {
    return this.orderRepository.findByAmountRange(minAmount, maxAmount);
  }

  // Private helper methods
  private canUserViewOrder(order: Order, userId: string): boolean {
    // Admin can view all orders
    // Customer can view their own orders
    // Business owner can view orders for their business
    return order.customerId === userId || 
           order.businessOwnerId === userId || 
           userId === 'admin';
  }

  private canUserUpdateOrder(order: Order, userId: string): boolean {
    // Admin can update all orders
    // Business owner can update orders for their business
    // Customer can only update their own pending orders
    if (userId === 'admin') return true;
    if (order.businessOwnerId === userId) return true;
    if (order.customerId === userId && order.status === 'pending') return true;
    
    return false;
  }

  private canUserDeleteOrder(order: Order, userId: string): boolean {
    // Admin can delete all orders
    // Customer can only delete their own pending orders
    if (userId === 'admin') return true;
    if (order.customerId === userId && order.status === 'pending') return true;
    
    return false;
  }

  private validateAddress(address: Address): string[] {
    const errors: string[] = [];

    if (!address.firstName) errors.push('First name is required');
    if (!address.lastName) errors.push('Last name is required');
    if (!address.address1) errors.push('Address line 1 is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.zipCode) errors.push('ZIP code is required');
    if (!address.country) errors.push('Country is required');
    if (!address.phone) errors.push('Phone number is required');

    return errors;
  }

  private convertRepositoryStats(stats: RepositoryOrderStats): OrderStats {
    return {
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      averageOrderValue: stats.averageOrderValue,
      ordersByStatus: stats.ordersByStatus,
      ordersByPaymentStatus: stats.ordersByPaymentStatus,
      recentOrders: stats.recentOrders
    };
  }
}


