import { OrderRepository } from '../OrderRepository';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Order } from '@/types/firebase';

// Mock FirebaseAdminService
jest.mock('@/services/firebase-admin');

describe('OrderRepository', () => {
  let orderRepository: OrderRepository;
  let mockFirebaseAdminService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirebaseAdminService = FirebaseAdminService as any;
    orderRepository = new OrderRepository();
  });

  describe('findByCustomer', () => {
    it('should find orders by customer ID', async () => {
      // Arrange
      const customerId = 'customer-1';
      const expectedOrders = [
        { id: 'order-1', customerId, status: 'pending' },
        { id: 'order-2', customerId, status: 'shipped' }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.findByCustomer(customerId);

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [{ field: 'customerId', operator: '==', value: customerId }],
        { field: 'createdAt', direction: 'desc' },
        undefined
      );
    });
  });

  describe('findByBusinessOwner', () => {
    it('should find orders by business owner ID', async () => {
      // Arrange
      const businessOwnerId = 'business-1';
      const expectedOrders = [
        { id: 'order-1', businessOwnerId, status: 'pending' },
        { id: 'order-2', businessOwnerId, status: 'processing' }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.findByBusinessOwner(businessOwnerId);

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [{ field: 'businessOwnerId', operator: '==', value: businessOwnerId }],
        { field: 'createdAt', direction: 'desc' },
        undefined
      );
    });
  });

  describe('findByStatus', () => {
    it('should find orders by status', async () => {
      // Arrange
      const status = 'pending';
      const expectedOrders = [
        { id: 'order-1', status, customerId: 'customer-1' },
        { id: 'order-2', status, customerId: 'customer-2' }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.findByStatus(status);

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [{ field: 'status', operator: '==', value: status }],
        { field: 'createdAt', direction: 'desc' },
        undefined
      );
    });
  });

  describe('findWithFilters', () => {
    it('should find orders with multiple filters', async () => {
      // Arrange
      const filters = {
        customerId: 'customer-1',
        status: 'pending',
        minAmount: 50
      };

      const expectedOrders = [
        { id: 'order-1', customerId: 'customer-1', status: 'pending', totalAmount: 75 }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.findWithFilters(filters, 'createdAt', 'desc', 10);

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [
          { field: 'customerId', operator: '==', value: 'customer-1' },
          { field: 'status', operator: '==', value: 'pending' },
          { field: 'totalAmount', operator: '>=', value: 50 }
        ],
        { field: 'createdAt', direction: 'desc' },
        10
      );
    });

    it('should handle empty filters', async () => {
      // Arrange
      const expectedOrders = [
        { id: 'order-1', status: 'pending' },
        { id: 'order-2', status: 'shipped' }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.findWithFilters({});

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [],
        { field: 'createdAt', direction: 'desc' },
        undefined
      );
    });
  });

  describe('getOrderStats', () => {
    it('should calculate order statistics', async () => {
      // Arrange
      const orders = [
        { id: 'order-1', status: 'pending', paymentStatus: 'pending', totalAmount: 100 },
        { id: 'order-2', status: 'shipped', paymentStatus: 'paid', totalAmount: 150 },
        { id: 'order-3', status: 'delivered', paymentStatus: 'paid', totalAmount: 200 },
        { id: 'order-4', status: 'cancelled', paymentStatus: 'failed', totalAmount: 50 }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(orders);

      // Act
      const result = await orderRepository.getOrderStats();

      // Assert
      expect(result.totalOrders).toBe(4);
      expect(result.totalRevenue).toBe(500);
      expect(result.averageOrderValue).toBe(125);
      expect(result.ordersByStatus).toEqual({
        pending: 1,
        shipped: 1,
        delivered: 1,
        cancelled: 1
      });
      expect(result.ordersByPaymentStatus).toEqual({
        pending: 1,
        paid: 2,
        failed: 1
      });
      expect(result.recentOrders).toHaveLength(4);
    });

    it('should handle empty orders', async () => {
      // Arrange
      mockFirebaseAdminService.queryDocuments.mockResolvedValue([]);

      // Act
      const result = await orderRepository.getOrderStats();

      // Assert
      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
      expect(result.ordersByStatus).toEqual({});
      expect(result.ordersByPaymentStatus).toEqual({});
      expect(result.recentOrders).toHaveLength(0);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      // Arrange
      const orderId = 'order-1';
      const status = 'shipped';
      const updatedOrder = { id: orderId, status, updatedAt: new Date() };

      mockFirebaseAdminService.updateDocument.mockResolvedValue(updatedOrder);

      // Act
      const result = await orderRepository.updateOrderStatus(orderId, status);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockFirebaseAdminService.updateDocument).toHaveBeenCalledWith(
        Collections.ORDERS,
        orderId,
        {
          status,
          updatedAt: expect.any(Date)
        }
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      // Arrange
      const orderId = 'order-1';
      const paymentStatus = 'paid';
      const updatedOrder = { id: orderId, paymentStatus, updatedAt: new Date() };

      mockFirebaseAdminService.updateDocument.mockResolvedValue(updatedOrder);

      // Act
      const result = await orderRepository.updatePaymentStatus(orderId, paymentStatus);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockFirebaseAdminService.updateDocument).toHaveBeenCalledWith(
        Collections.ORDERS,
        orderId,
        {
          paymentStatus,
          updatedAt: expect.any(Date)
        }
      );
    });
  });

  describe('addTrackingNumber', () => {
    it('should add tracking number and update status to shipped', async () => {
      // Arrange
      const orderId = 'order-1';
      const trackingNumber = 'TRACK123';
      const updatedOrder = { 
        id: orderId, 
        trackingNumber, 
        status: 'shipped',
        updatedAt: new Date() 
      };

      mockFirebaseAdminService.updateDocument.mockResolvedValue(updatedOrder);

      // Act
      const result = await orderRepository.addTrackingNumber(orderId, trackingNumber);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockFirebaseAdminService.updateDocument).toHaveBeenCalledWith(
        Collections.ORDERS,
        orderId,
        {
          trackingNumber,
          status: 'shipped',
          updatedAt: expect.any(Date)
        }
      );
    });
  });

  describe('getOrdersByProduct', () => {
    it('should find orders containing specific product', async () => {
      // Arrange
      const productId = 'product-1';
      const allOrders = [
        { 
          id: 'order-1', 
          items: [{ productId: 'product-1', quantity: 2 }] 
        },
        { 
          id: 'order-2', 
          items: [{ productId: 'product-2', quantity: 1 }] 
        },
        { 
          id: 'order-3', 
          items: [
            { productId: 'product-1', quantity: 1 },
            { productId: 'product-3', quantity: 3 }
          ] 
        }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(allOrders);

      // Act
      const result = await orderRepository.getOrdersByProduct(productId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('order-1');
      expect(result[1].id).toBe('order-3');
    });
  });

  describe('getCustomerOrderCount', () => {
    it('should return count of orders for customer', async () => {
      // Arrange
      const customerId = 'customer-1';
      const orders = [
        { id: 'order-1', customerId },
        { id: 'order-2', customerId },
        { id: 'order-3', customerId }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(orders);

      // Act
      const result = await orderRepository.getCustomerOrderCount(customerId);

      // Assert
      expect(result).toBe(3);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [{ field: 'customerId', operator: '==', value: customerId }]
      );
    });
  });

  describe('getCustomerTotalSpent', () => {
    it('should calculate total spent by customer', async () => {
      // Arrange
      const customerId = 'customer-1';
      const orders = [
        { id: 'order-1', customerId, totalAmount: 100 },
        { id: 'order-2', customerId, totalAmount: 150 },
        { id: 'order-3', customerId, totalAmount: 75 }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(orders);

      // Act
      const result = await orderRepository.getCustomerTotalSpent(customerId);

      // Assert
      expect(result).toBe(325);
    });
  });

  describe('getBusinessOwnerTotalRevenue', () => {
    it('should calculate total revenue for business owner', async () => {
      // Arrange
      const businessOwnerId = 'business-1';
      const orders = [
        { id: 'order-1', businessOwnerId, totalAmount: 200 },
        { id: 'order-2', businessOwnerId, totalAmount: 300 },
        { id: 'order-3', businessOwnerId, totalAmount: 150 }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(orders);

      // Act
      const result = await orderRepository.getBusinessOwnerTotalRevenue(businessOwnerId);

      // Assert
      expect(result).toBe(650);
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with limit', async () => {
      // Arrange
      const limit = 5;
      const expectedOrders = [
        { id: 'order-1', createdAt: new Date('2024-01-01') },
        { id: 'order-2', createdAt: new Date('2024-01-02') },
        { id: 'order-3', createdAt: new Date('2024-01-03') }
      ];

      mockFirebaseAdminService.queryDocuments.mockResolvedValue(expectedOrders);

      // Act
      const result = await orderRepository.getRecentOrders(limit);

      // Assert
      expect(result).toEqual(expectedOrders);
      expect(mockFirebaseAdminService.queryDocuments).toHaveBeenCalledWith(
        Collections.ORDERS,
        [],
        { field: 'createdAt', direction: 'desc' },
        limit
      );
    });
  });
});


