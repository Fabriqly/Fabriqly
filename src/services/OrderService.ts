import { OrderRepository, OrderFilters, OrderStats as RepositoryOrderStats } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { Order } from '@/types/firebase';

import { ActivityType } from '@/types/activity';
import { Timestamp } from 'firebase-admin/firestore';

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
import { CouponService } from './CouponService';
import { DiscountService } from './DiscountService';
import { AppliedDiscount } from '@/types/promotion';
import { calculateCommission } from '@/utils/commission';

export class OrderService implements IOrderService {
  private couponService: CouponService;
  private discountService: DiscountService;

  constructor(
    private orderRepository: OrderRepository,
    private activityRepository: ActivityRepository,
    private productRepository: ProductRepository,
    private cacheService: CacheService
  ) {
    this.couponService = new CouponService();
    this.discountService = new DiscountService();
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    return PerformanceMonitor.measure('OrderService.createOrder', async () => {
      // Validate order data
      const validation = await this.validateOrderData(data);
      if (!validation.isValid) {
        throw AppError.badRequest('Invalid order data', validation.errors);
      }

      // Separate product and design items FIRST
      const productItems = data.items.filter(item => (item as Record<string, unknown>).itemType !== 'design' && item.productId);
      const designItems = data.items.filter(item => (item as Record<string, unknown>).itemType === 'design' && (item as Record<string, unknown>).designId);
      
      // Calculate subtotals separately
      const productSubtotal = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const designSubtotal = designItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const subtotal = productSubtotal + designSubtotal; // Total subtotal for display
      
      // Check if this is a design-only order (no shipping)
      const isDesignOnlyOrder = designItems.length > 0 && productItems.length === 0;
      const effectiveShippingCost = isDesignOnlyOrder ? 0 : (data.shippingCost || 0);
      
      // Apply discounts/coupons with scope awareness
      let productDiscountAmount = 0; // Discount on products/subtotal
      let shippingDiscountAmount = 0; // Discount on shipping
      const appliedDiscounts: AppliedDiscount[] = [];
      
      console.log('[OrderService] Creating order with couponCode:', data.couponCode, 'subtotal:', subtotal, 'isDesignOnly:', isDesignOnlyOrder);
      
      if (data.couponCode) {
        const productIds = productItems.map(item => item.productId!);
        
        // Fetch products to get category IDs
        const products = await Promise.all(
          productIds.map(id => this.productRepository.findById(id))
        );
        const categoryIds = products
          .filter(p => p && p.categoryId)
          .map(p => p!.categoryId!)
          .filter(Boolean);

        // Get shipping cost
        const shipping = data.shippingCost || 0;

        // Calculate applicable amount for product/category scoped discounts
        let applicableAmount = 0;
        if (products.length > 0) {
          // For product/category scopes, we need to calculate from matching items
          // This will be refined when we get the discount scope
        }

        // For coupons, use product subtotal only (designs shouldn't be discounted)
        const couponResult = await this.couponService.applyCoupon(data.couponCode, {
          userId: data.customerId,
          orderAmount: productSubtotal, // Only product subtotal for coupon validation
          productIds,
          categoryIds,
          shippingCost: shipping,
          applicableAmount
        });

        console.log('[OrderService] Coupon validation result:', {
          success: couponResult.success,
          hasDiscount: !!couponResult.discount,
          discountAmount: couponResult.discountAmount,
          error: couponResult.error
        });
        
        if (couponResult.success && couponResult.discount && couponResult.discountAmount !== undefined) {
          const discount = couponResult.discount;
          
          console.log('[OrderService] Applying discount:', {
            scope: discount.scope,
            type: discount.type,
            value: discount.value,
            targetIds: discount.targetIds
          });
          
          // Calculate discount based on scope
          if (discount.scope === 'shipping') {
            // Shipping discount applies only to shipping cost
            shippingDiscountAmount = this.discountService.calculateDiscount(
              discount,
              subtotal,
              undefined,
              shipping
            );
          } else if (discount.scope === 'product') {
            // Product discount applies to matching products only (not designs)
            const matchingItems = productItems.filter(item => 
              discount.targetIds?.includes(item.productId)
            );
            const matchingAmount = matchingItems.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0
            );
            productDiscountAmount = this.discountService.calculateDiscount(
              discount,
              productSubtotal,
              matchingAmount
            );
          } else if (discount.scope === 'category') {
            // Category discount applies to matching category products (not designs)
            const matchingProducts = products.filter(p => 
              p && p.categoryId && discount.targetIds?.includes(p.categoryId)
            );
            const matchingProductIds = matchingProducts.map(p => p!.id);
            const matchingItems = productItems.filter(item => 
              matchingProductIds.includes(item.productId)
            );
            const matchingAmount = matchingItems.reduce((sum, item) => 
              sum + (item.price * item.quantity), 0
            );
            productDiscountAmount = this.discountService.calculateDiscount(
              discount,
              productSubtotal,
              matchingAmount
            );
          } else {
            // Order-level discount applies to product subtotal only (designs are never discounted)
            productDiscountAmount = this.discountService.calculateDiscount(
              discount,
              productSubtotal
            );
          }

          appliedDiscounts.push({
            discountId: discount.id,
            couponCode: data.couponCode,
            discountType: discount.type,
            discountValue: discount.value,
            discountAmount: discount.scope === 'shipping' ? shippingDiscountAmount : productDiscountAmount,
            scope: discount.scope,
            // Only include targetIds if it exists and is not undefined
            // For order-level and shipping-level discounts, targetIds may not be set
            ...(discount.targetIds && discount.targetIds.length > 0 ? { targetIds: discount.targetIds } : {})
          });
        }
      }

      // Calculate tax on subtotal after product discount (shipping discount doesn't affect tax)
      // Tax applies to both products and designs, but discount only applies to products
      const taxableAmount = Math.max(0, subtotal - productDiscountAmount);
      const tax = taxableAmount * 0.12; // 12% VAT (Philippines standard VAT rate)
      const shipping = data.shippingCost || 0;
      const shippingAfterDiscount = Math.max(0, effectiveShippingCost - shippingDiscountAmount);
      
      // Calculate platform commission/convenience fee (8% per transaction - approved rate)
      const commissionResult = calculateCommission({
        productSubtotal,
        designSubtotal
      });
      const commissionFee = commissionResult.amount;
      
      // Total = (productSubtotal + designSubtotal - productDiscount) + tax + commissionFee + (shipping - shipping discount)
      // Designs are never discounted, so: (productSubtotal - productDiscount) + designSubtotal + tax + commissionFee + shipping
      // For design-only orders, shipping is 0
      const totalAmount = taxableAmount + tax + commissionFee + shippingAfterDiscount;

      console.log('[OrderService] Order totals calculated:', {
        subtotal,
        productSubtotal,
        designSubtotal,
        productDiscountAmount,
        shippingDiscountAmount,
        taxableAmount,
        tax,
        commissionRate: commissionResult.rate,
        commissionFee,
        commissionType: commissionResult.type,
        shipping,
        shippingAfterDiscount,
        totalAmount,
        couponCode: data.couponCode
      });

      // Create order
      const now = Timestamp.now();
      const totalDiscountAmount = productDiscountAmount + shippingDiscountAmount;
      
      // Design-only orders are automatically delivered (digital products)
      // Set status to 'delivered' immediately for design-only orders
      const initialStatus = isDesignOnlyOrder ? 'delivered' as const : 'pending' as const;
      
      const orderData = {
        customerId: data.customerId,
        businessOwnerId: data.businessOwnerId,
        items: data.items,
        subtotal,
        discountAmount: totalDiscountAmount > 0 ? totalDiscountAmount : undefined,
        tax,
        commissionFee, // Platform commission/convenience fee
        shippingCost: effectiveShippingCost, // 0 for design-only orders
        totalAmount,
        status: initialStatus,
        paymentStatus: 'pending' as const,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        appliedDiscounts: appliedDiscounts.length > 0 ? appliedDiscounts : undefined,
        appliedCouponCode: data.couponCode,
        statusHistory: [
          {
            status: initialStatus,
            timestamp: now,
            updatedBy: isDesignOnlyOrder ? 'system' : data.customerId
          }
        ],
        createdAt: now,
        updatedAt: now
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

      // Send order created email (non-blocking)
      try {
        const { EmailService } = await import('./EmailService');
        const { FirebaseAdminService } = await import('./firebase-admin');
        const { Collections } = await import('./firebase');
        
        // Get customer and business owner data
        const [customerDoc, businessOwnerDoc] = await Promise.all([
          FirebaseAdminService.getDocument(Collections.USERS, data.customerId),
          FirebaseAdminService.getDocument(Collections.USERS, data.businessOwnerId),
        ]);
        
        if (customerDoc) {
          const customer = {
            email: customerDoc.email,
            firstName: customerDoc.profile?.firstName,
            lastName: customerDoc.profile?.lastName,
            displayName: customerDoc.displayName || `${customerDoc.profile?.firstName || ''} ${customerDoc.profile?.lastName || ''}`.trim() || customerDoc.email,
          };
          
          const businessOwner = businessOwnerDoc ? {
            email: businessOwnerDoc.email,
            firstName: businessOwnerDoc.profile?.firstName,
            lastName: businessOwnerDoc.profile?.lastName,
            displayName: businessOwnerDoc.displayName || `${businessOwnerDoc.profile?.firstName || ''} ${businessOwnerDoc.profile?.lastName || ''}`.trim() || businessOwnerDoc.email,
          } : undefined;
          
          EmailService.sendOrderCreatedEmail({
            order,
            customer,
            businessOwner,
          }).catch((emailError) => {
            console.error('Error sending order created email:', emailError);
          });
        }
      } catch (emailError) {
        console.error('Error setting up order created email:', emailError);
        // Don't fail order creation if email fails
      }

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

      // Validate payment status before allowing shipment or delivery
      // Orders must be paid before they can be shipped or delivered
      if (data.status && (data.status === 'shipped' || data.status === 'delivered')) {
        if (existingOrder.paymentStatus !== 'paid') {
          throw AppError.badRequest(
            `Order must be paid before it can be marked as ${data.status}. Current payment status: ${existingOrder.paymentStatus}`
          );
        }
      }

      // Add status history if status is changing
      const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
      if (data.status && data.status !== existingOrder.status) {
        const statusHistory = existingOrder.statusHistory || [];
        statusHistory.push({
          status: data.status,
          timestamp: Timestamp.now(),
          updatedBy: userId
        });
        updateData.statusHistory = statusHistory;
      }

      // Handle inventory restoration if order is being cancelled
      // Only restore if order was previously paid/processing (inventory was decremented)
      if (data.status === 'cancelled' && existingOrder.status !== 'cancelled') {
        const shouldRestoreInventory = 
          existingOrder.paymentStatus === 'paid' || 
          existingOrder.status === 'processing' || 
          existingOrder.status === 'to_ship' ||
          existingOrder.status === 'shipped';
        
        if (shouldRestoreInventory && existingOrder.items && existingOrder.items.length > 0) {
          console.log(`[OrderService] Restoring inventory for cancelled order ${orderId}`);
          try {
            const { ProductService } = await import('./ProductService');
            const { CategoryRepository } = await import('@/repositories/CategoryRepository');
            
            const categoryRepository = new CategoryRepository();
            const productService = new ProductService(this.productRepository, categoryRepository, this.activityRepository);
            
            await Promise.all(
              existingOrder.items.map(async (item: Record<string, unknown>) => {
                try {
                  const result = await productService.incrementStock(
                    item.productId,
                    item.quantity,
                    orderId
                  );
                  if (!result) {
                    console.error(`[OrderService] Failed to restore stock for product ${item.productId} in order ${orderId}`);
                  }
                } catch (error) {
                  console.error(`[OrderService] Error restoring stock for product ${item.productId}:`, error);
                  // Continue processing other items even if one fails
                }
              })
            );
          } catch (error) {
            console.error(`[OrderService] Error restoring inventory for order ${orderId}:`, error);
            // Don't fail order cancellation if inventory restoration fails
          }
        }
      }

      // Update order
      const updatedOrder = await this.orderRepository.update(orderId, updateData);

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

      // Check if order status changed to shipped/delivered and trigger shop payment
      if (data.status && (data.status === 'shipped' || data.status === 'delivered')) {
        await this.handleOrderShippedOrDelivered(updatedOrder);
      }

      // Update shop stats when order is marked as delivered
      if (data.status && data.status === 'delivered') {
        await this.updateShopStatsForDeliveredOrder(updatedOrder);
      }

      // Send status change emails (non-blocking)
      if (data.status && data.status !== existingOrder.status) {
        try {
          const { EmailService } = await import('./EmailService');
          
          if (data.status === 'shipped') {
            EmailService.sendOrderShippedEmail(
              orderId,
              existingOrder.customerId,
              updatedOrder.trackingNumber,
              updatedOrder.carrier
            ).catch((emailError) => {
              console.error('Error sending order shipped email:', emailError);
            });
          } else if (data.status === 'delivered') {
            EmailService.sendOrderDeliveredEmail(
              orderId,
              existingOrder.customerId,
              existingOrder.businessOwnerId
            ).catch((emailError) => {
              console.error('Error sending order delivered email:', emailError);
            });
          } else if (data.status === 'cancelled') {
            EmailService.sendOrderCancelledEmail(
              orderId,
              existingOrder.customerId,
              existingOrder.businessOwnerId,
              data.notes // Use notes as cancellation reason if provided
            ).catch((emailError) => {
              console.error('Error sending order cancelled email:', emailError);
            });
          }
        } catch (emailError) {
          console.error('Error setting up status change email:', emailError);
          // Don't fail order update if email fails
        }
      }

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

      // Get orders from repository (without sorting to avoid composite index issues)
      const orders = await this.orderRepository.findWithFilters(filters);

      // Filter orders based on user permissions
      const filteredOrders = orders.filter(order => this.canUserViewOrder(order, userId));

      // Sort in memory to avoid composite index requirements
      const sortedOrders = filteredOrders.sort((a, b) => {
        const sortField = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        
        let aValue = a[sortField as keyof Order];
        let bValue = b[sortField as keyof Order];
        
        // Handle timestamp fields
        if (sortField === 'createdAt' || sortField === 'updatedAt') {
          aValue = aValue instanceof Date ? aValue : new Date(String(aValue));
          bValue = bValue instanceof Date ? bValue : new Date(String(bValue));
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply limit after sorting
      const limitedOrders = options.limit ? sortedOrders.slice(0, options.limit) : sortedOrders;

      // Calculate totals
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        orders: limitedOrders,
        total: filteredOrders.length,
        totalRevenue,
        hasMore: filteredOrders.length === (options.limit || 50)
      };
    });
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled', userId: string): Promise<Order> {
    return this.updateOrder(orderId, { status }, userId);
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded', userId: string): Promise<Order> {
    return this.updateOrder(orderId, { paymentStatus }, userId);
  }

  async addTrackingNumber(orderId: string, trackingNumber: string, carrier?: string, userId?: string): Promise<Order> {
    // Get current order to check status
    const existingOrder = await this.orderRepository.findById(orderId);
    if (!existingOrder) {
      throw AppError.notFound('Order not found');
    }

    const updateData: UpdateOrderData = { 
      trackingNumber
    };
    
    // Only set status to 'shipped' if not already shipped
    if (existingOrder.status !== 'shipped') {
      updateData.status = 'shipped';
    }
    
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
      // Validate items - handle products and designs differently
      for (let index = 0; index < data.items.length; index++) {
        const item = data.items[index] as Record<string, unknown>;
        const isDesign = item.itemType === 'design';
        const isProduct = item.itemType === 'product' || (!item.itemType && item.productId);
        
        // Validate quantity and price for all items
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Valid quantity is required`);
        }
        if (!item.price || item.price < 0) {
          errors.push(`Item ${index + 1}: Valid price is required`);
        }

        // For design items, validate designId instead of productId
        if (isDesign) {
          if (!item.designId) {
            errors.push(`Item ${index + 1}: Design ID is required`);
          }
          // Designs are digital - no stock validation needed
        } 
        // For product items, validate productId and check stock
        else if (isProduct) {
          if (!item.productId) {
            errors.push(`Item ${index + 1}: Product ID is required`);
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
        } else {
          // Unknown item type - require either productId or designId
          if (!item.productId && !item.designId) {
            errors.push(`Item ${index + 1}: Either Product ID or Design ID is required`);
          }
        }
      }
    }

    // Check if this is a design-only order (no shipping needed)
    const productItems = data.items.filter((item: Record<string, unknown>) => (item as Record<string, unknown>).itemType !== 'design' && item.productId);
    const designItems = data.items.filter((item: Record<string, unknown>) => (item as Record<string, unknown>).itemType === 'design' && (item as Record<string, unknown>).designId);
    const isDesignOnlyOrder = designItems.length > 0 && productItems.length === 0;
    
    // Shipping address is only required for orders with physical products
    if (!isDesignOnlyOrder) {
      if (!data.shippingAddress) {
        errors.push('Shipping address is required');
      } else {
        const addressErrors = this.validateAddress(data.shippingAddress);
        errors.push(...addressErrors.map(error => `Shipping address: ${error}`));
      }
      
      // Billing address validation only for orders with physical products
      if (data.billingAddress) {
        const addressErrors = this.validateAddress(data.billingAddress);
        errors.push(...addressErrors.map(error => `Billing address: ${error}`));
      }
    }
    // For design-only orders, skip address validation entirely

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

    if (data.status && !['pending', 'processing', 'to_ship', 'shipped', 'delivered', 'cancelled'].includes(data.status)) {
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
      'processing': ['to_ship', 'cancelled'],
      'to_ship': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getValidStatusTransitions(currentStatus: string): string[] {
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['to_ship', 'cancelled'],
      'to_ship': ['shipped', 'cancelled'],
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

  // New functions for order management
  async markOrderToShip(orderId: string, userId: string): Promise<Order> {
    return PerformanceMonitor.measure('OrderService.markOrderToShip', async () => {
      const existingOrder = await this.orderRepository.findById(orderId);
      if (!existingOrder) {
        throw AppError.notFound('Order not found');
      }

      // Check if user can update this order
      if (!this.canUserUpdateOrder(existingOrder, userId)) {
        throw AppError.forbidden('Insufficient permissions to update this order');
      }

      // Validate status transition
      if (!this.canUpdateStatus(existingOrder.status, 'to_ship')) {
        throw AppError.badRequest(`Cannot mark order as 'to_ship' from current status: ${existingOrder.status}`);
      }

      // Update order status to 'to_ship'
      const updatedOrder = await this.updateOrderStatus(orderId, 'to_ship', userId);

      // Log activity
      await this.activityRepository.create({
        type: 'order_status_changed',
        title: 'Order Ready to Ship',
        description: `Order #${orderId} has been marked as ready to ship`,
        priority: 'high',
        status: 'active',
        targetId: orderId,
        actorId: userId,
        metadata: {
          orderId,
          previousStatus: existingOrder.status,
          newStatus: 'to_ship',
          customerId: existingOrder.customerId,
          businessOwnerId: existingOrder.businessOwnerId
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Emit event
      eventBus.emit('order.status_changed', {
        orderId,
        previousStatus: existingOrder.status,
        newStatus: 'to_ship',
        customerId: existingOrder.customerId,
        businessOwnerId: existingOrder.businessOwnerId
      });

      return updatedOrder;
    });
  }

  async getOrdersToShip(businessOwnerId?: string, userId?: string): Promise<Order[]> {
    return PerformanceMonitor.measure('OrderService.getOrdersToShip', async () => {
      const searchOptions: OrderSearchOptions = {
        status: 'to_ship',
        businessOwnerId,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await this.getOrders(searchOptions, userId || 'system');
      return result.orders;
    });
  }

  async getOrdersByStatus(status: 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled', businessOwnerId?: string, userId?: string): Promise<Order[]> {
    return PerformanceMonitor.measure('OrderService.getOrdersByStatus', async () => {
      const searchOptions: OrderSearchOptions = {
        status,
        businessOwnerId,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await this.getOrders(searchOptions, userId || 'system');
      return result.orders;
    });
  }

  async getOrdersByAmountRange(minAmount: number, maxAmount: number): Promise<Order[]> {
    return this.orderRepository.findByAmountRange(minAmount, maxAmount);
  }

  /**
   * Handle order shipped or delivered - trigger shop payment release for customization orders
   */
  private async handleOrderShippedOrDelivered(order: Order): Promise<void> {
    try {
      // Check if this order has a customization request (design service order)
      const customizationRequestId = order.items?.[0]?.customizations?.customizationRequestId;
      
      if (!customizationRequestId) {
        // Not a customization order, skip
        return;
      }

      console.log(`[OrderService] Order ${order.id} shipped/delivered. Checking if shop payment can be released...`);

      // Import services dynamically to avoid circular dependencies
      const { CustomizationRepository } = await import('@/repositories/CustomizationRepository');
      const { escrowService } = await import('./EscrowService');
      
      const customizationRepo = new CustomizationRepository();
      const request = await customizationRepo.findById(customizationRequestId);

      if (!request) {
        console.warn(`[OrderService] Customization request ${customizationRequestId} not found`);
        return;
      }

      // Check if production is completed
      if (request.productionDetails?.status !== 'completed') {
        console.log(`[OrderService] Production not completed yet. Status: ${request.productionDetails?.status}`);
        return;
      }

      // Check if designer has been paid
      if (request.paymentDetails?.escrowStatus !== 'designer_paid') {
        console.log(`[OrderService] Designer not paid yet. Escrow status: ${request.paymentDetails?.escrowStatus}`);
        return;
      }

      // All conditions met, release shop payment
      console.log(`[OrderService] All conditions met. Releasing shop payment...`);
      await escrowService.releaseShopPayment(customizationRequestId);
      console.log(`[OrderService] Shop payment released successfully for request ${customizationRequestId}`);
    } catch (error: unknown) {
      console.error('[OrderService] Failed to release shop payment:', error);
      // Don't throw error - we don't want to fail the order update
      // Admin can manually trigger payout if needed
    }
  }

  private async updateShopStatsForDeliveredOrder(order: Order): Promise<void> {
    try {
      if (!order.businessOwnerId) {
        return;
      }

      // Import services dynamically to avoid circular dependencies
      const { ShopProfileService } = await import('./ShopProfileService');
      const { ShopProfileRepository } = await import('@/repositories/ShopProfileRepository');
      const { ActivityRepository } = await import('@/repositories/ActivityRepository');
      
      const shopProfileRepo = new ShopProfileRepository();
      const activityRepo = new ActivityRepository();
      const shopProfileService = new ShopProfileService(shopProfileRepo, activityRepo);

      // Find shop profile by businessOwnerId
      const shopProfile = await shopProfileService.getShopProfileByUserId(order.businessOwnerId);
      
      if (!shopProfile) {
        return;
      }

      const currentTotalOrders = shopProfile.shopStats?.totalOrders || 0;
      const newTotalOrders = currentTotalOrders + 1;

      // Update shop stats: increment totalOrders
      await shopProfileService.updateShopStats(shopProfile.id, {
        totalOrders: newTotalOrders
      });
    } catch (error: unknown) {
      console.error('[OrderService] Failed to update shop stats:', error);
      // Don't throw error - we don't want to fail the order update
    }
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
    // Customer can update their own pending orders (for cancellation) or shipped orders (for delivery confirmation)
    if (userId === 'admin') return true;
    if (order.businessOwnerId === userId) return true;
    if (order.customerId === userId && (order.status === 'pending' || order.status === 'shipped')) return true;
    
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


