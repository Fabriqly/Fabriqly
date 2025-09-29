import { OrderService } from '../OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';
import { AppError } from '@/errors/AppError';
import { CreateOrderData, UpdateOrderData } from '@/services/interfaces/IOrderService';
import { createMockUser, createMockProduct } from './setup';

// Mock repositories and services
jest.mock('@/repositories/OrderRepository');
jest.mock('@/repositories/ActivityRepository');
jest.mock('@/repositories/ProductRepository');
jest.mock('@/services/CacheService');

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: any;
  let mockActivityRepository: any;
  let mockProductRepository: any;
  let mockCacheService: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockOrderRepository = new OrderRepository() as any;
    mockActivityRepository = new ActivityRepository() as any;
    mockProductRepository = new ProductRepository() as any;
    mockCacheService = new CacheService() as any;

    // Create service with mocked dependencies
    orderService = new OrderService(
      mockOrderRepository,
      mockActivityRepository,
      mockProductRepository,
      mockCacheService
    );
  });

  describe('createOrder', () => {
    const validOrderData: CreateOrderData = {
      customerId: 'customer-1',
      businessOwnerId: 'business-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          price: 25.00,
          customizations: { color: 'red', size: 'M' }
        }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        phone: '555-1234'
      },
      paymentMethod: 'card',
      notes: 'Please handle with care',
      shippingCost: 9.99
    };

    it('should create a valid order', async () => {
      // Arrange
      const expectedOrder = {
        id: 'order-1',
        ...validOrderData,
        subtotal: 50.00,
        tax: 4.00,
        totalAmount: 63.99,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderRepository.create.mockResolvedValue(expectedOrder);
      mockActivityRepository.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      // Act
      const result = await orderService.createOrder(validOrderData);

      // Assert
      expect(result).toEqual(expectedOrder);
      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: validOrderData.customerId,
          businessOwnerId: validOrderData.businessOwnerId,
          items: validOrderData.items,
          subtotal: 50.00,
          tax: 4.00,
          totalAmount: 63.99,
          status: 'pending',
          paymentStatus: 'pending'
        })
      );
      expect(mockActivityRepository.create).toHaveBeenCalled();
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('orders:customer:customer-1');
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('orders:business:business-1');
    });

    it('should validate order data', async () => {
      // Arrange
      const invalidOrderData = {
        ...validOrderData,
        customerId: '', // Invalid
        items: [] // Invalid
      };

      // Act & Assert
      await expect(orderService.createOrder(invalidOrderData as any))
        .rejects
        .toThrow(AppError);
    });

    it('should calculate totals correctly', async () => {
      // Arrange
      const orderData = {
        ...validOrderData,
        items: [
          { productId: 'product-1', quantity: 2, price: 25.00 },
          { productId: 'product-2', quantity: 1, price: 15.00 }
        ],
        shippingCost: 5.00
      };

      const expectedOrder = {
        id: 'order-1',
        ...orderData,
        subtotal: 65.00, // (2 * 25) + (1 * 15)
        tax: 5.20, // 65 * 0.08
        totalAmount: 75.20, // 65 + 5.20 + 5.00
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderRepository.create.mockResolvedValue(expectedOrder);
      mockActivityRepository.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      // Act
      const result = await orderService.createOrder(orderData);

      // Assert
      expect(result.subtotal).toBe(65.00);
      expect(result.tax).toBe(5.20);
      expect(result.totalAmount).toBe(75.20);
    });
  });

  describe('updateOrder', () => {
    const existingOrder = {
      id: 'order-1',
      customerId: 'customer-1',
      businessOwnerId: 'business-1',
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: 100.00,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update order successfully', async () => {
      // Arrange
      const updateData: UpdateOrderData = {
        status: 'processing',
        notes: 'Updated notes'
      };

      const updatedOrder = {
        ...existingOrder,
        ...updateData,
        updatedAt: new Date()
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);
      mockOrderRepository.update.mockResolvedValue(updatedOrder);
      mockActivityRepository.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      // Act
      const result = await orderService.updateOrder('order-1', updateData, 'business-1');

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining(updateData)
      );
    });

    it('should validate status transitions', async () => {
      // Arrange
      const updateData: UpdateOrderData = {
        status: 'delivered' // Invalid transition from pending
      };

      mockOrderRepository.findById.mockResolvedValue(existingOrder);

      // Act & Assert
      await expect(orderService.updateOrder('order-1', updateData, 'business-1'))
        .rejects
        .toThrow(AppError);
    });

    it('should check permissions', async () => {
      // Arrange
      const updateData: UpdateOrderData = { status: 'processing' };
      mockOrderRepository.findById.mockResolvedValue(existingOrder);

      // Act & Assert - Customer trying to update business owner's order
      await expect(orderService.updateOrder('order-1', updateData, 'customer-2'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('getOrder', () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      businessOwnerId: 'business-1',
      status: 'pending',
      totalAmount: 100.00
    };

    it('should return order if user has permission', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockOrderRepository.findById.mockResolvedValue(order);
      mockCacheService.set.mockResolvedValue(undefined);

      // Act
      const result = await orderService.getOrder('order-1', 'customer-1');

      // Assert
      expect(result).toEqual(order);
      expect(mockCacheService.set).toHaveBeenCalledWith('order:order-1', order, 300);
    });

    it('should return cached order if available', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(order);

      // Act
      const result = await orderService.getOrder('order-1', 'customer-1');

      // Assert
      expect(result).toEqual(order);
      expect(mockOrderRepository.findById).not.toHaveBeenCalled();
    });

    it('should return null if order not found', async () => {
      // Arrange
      mockCacheService.get.mockResolvedValue(null);
      mockOrderRepository.findById.mockResolvedValue(null);

      // Act
      const result = await orderService.getOrder('order-1', 'customer-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getOrders', () => {
    const orders = [
      {
        id: 'order-1',
        customerId: 'customer-1',
        businessOwnerId: 'business-1',
        status: 'pending',
        totalAmount: 100.00
      },
      {
        id: 'order-2',
        customerId: 'customer-1',
        businessOwnerId: 'business-2',
        status: 'shipped',
        totalAmount: 150.00
      }
    ];

    it('should return filtered orders', async () => {
      // Arrange
      mockOrderRepository.findWithFilters.mockResolvedValue(orders);

      // Act
      const result = await orderService.getOrders(
        { customerId: 'customer-1', limit: 10 },
        'customer-1'
      );

      // Assert
      expect(result.orders).toEqual(orders);
      expect(result.total).toBe(2);
      expect(result.totalRevenue).toBe(250.00);
      expect(mockOrderRepository.findWithFilters).toHaveBeenCalledWith(
        { customerId: 'customer-1' },
        undefined,
        undefined,
        10
      );
    });

    it('should filter orders by user permissions', async () => {
      // Arrange
      const allOrders = [
        { id: 'order-1', customerId: 'customer-1', businessOwnerId: 'business-1' },
        { id: 'order-2', customerId: 'customer-2', businessOwnerId: 'business-1' },
        { id: 'order-3', customerId: 'customer-1', businessOwnerId: 'business-2' }
      ];

      mockOrderRepository.findWithFilters.mockResolvedValue(allOrders);

      // Act
      const result = await orderService.getOrders({}, 'customer-1');

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders.every(order => order.customerId === 'customer-1')).toBe(true);
    });
  });

  describe('cancelOrder', () => {
    const order = {
      id: 'order-1',
      customerId: 'customer-1',
      businessOwnerId: 'business-1',
      status: 'pending',
      totalAmount: 100.00
    };

    it('should cancel order successfully', async () => {
      // Arrange
      const cancelledOrder = { ...order, status: 'cancelled' };
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockResolvedValue(cancelledOrder);
      mockActivityRepository.create.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      // Act
      const result = await orderService.cancelOrder('order-1', 'customer-1');

      // Assert
      expect(result.status).toBe('cancelled');
      expect(mockOrderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({ status: 'cancelled' })
      );
    });

    it('should not allow cancelling non-pending orders', async () => {
      // Arrange
      const shippedOrder = { ...order, status: 'shipped' };
      mockOrderRepository.findById.mockResolvedValue(shippedOrder);

      // Act & Assert
      await expect(orderService.cancelOrder('order-1', 'customer-1'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('validateOrderData', () => {
    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        customerId: '',
        businessOwnerId: '',
        items: [],
        shippingAddress: null,
        paymentMethod: ''
      };

      // Act
      const result = await orderService.validateOrderData(invalidData as any);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate address fields', async () => {
      // Arrange
      const invalidData = {
        customerId: 'customer-1',
        businessOwnerId: 'business-1',
        items: [{ productId: 'product-1', quantity: 1, price: 10 }],
        shippingAddress: {
          firstName: '',
          lastName: '',
          address1: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          phone: ''
        },
        paymentMethod: 'card'
      };

      // Act
      const result = await orderService.validateOrderData(invalidData);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('First name is required'))).toBe(true);
    });
  });

  describe('canUpdateStatus', () => {
    it('should allow valid status transitions', () => {
      expect(orderService.canUpdateStatus('pending', 'processing')).toBe(true);
      expect(orderService.canUpdateStatus('processing', 'shipped')).toBe(true);
      expect(orderService.canUpdateStatus('shipped', 'delivered')).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      expect(orderService.canUpdateStatus('pending', 'delivered')).toBe(false);
      expect(orderService.canUpdateStatus('delivered', 'pending')).toBe(false);
      expect(orderService.canUpdateStatus('cancelled', 'processing')).toBe(false);
    });
  });

  describe('getValidStatusTransitions', () => {
    it('should return correct transitions for each status', () => {
      expect(orderService.getValidStatusTransitions('pending')).toEqual(['processing', 'cancelled']);
      expect(orderService.getValidStatusTransitions('processing')).toEqual(['shipped', 'cancelled']);
      expect(orderService.getValidStatusTransitions('shipped')).toEqual(['delivered']);
      expect(orderService.getValidStatusTransitions('delivered')).toEqual([]);
      expect(orderService.getValidStatusTransitions('cancelled')).toEqual([]);
    });
  });
});


