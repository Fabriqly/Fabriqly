import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/orders/route';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';

// Mock dependencies
jest.mock('@/services/OrderService');
jest.mock('@/repositories/OrderRepository');
jest.mock('@/repositories/ActivityRepository');
jest.mock('@/repositories/ProductRepository');
jest.mock('@/services/CacheService');
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('/api/orders', () => {
  let mockOrderService: jest.Mocked<OrderService>;
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock session
    mockSession = {
      user: {
        id: 'user-1',
        role: 'customer'
      }
    };

    // Mock OrderService
    mockOrderService = new OrderService(
      new OrderRepository(),
      new ActivityRepository(),
      new ProductRepository(),
      new CacheService()
    ) as jest.Mocked<OrderService>;

    // Mock getServerSession
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/orders', () => {
    it('should return orders for authenticated user', async () => {
      // Arrange
      const mockOrders = [
        {
          id: 'order-1',
          customerId: 'user-1',
          businessOwnerId: 'business-1',
          status: 'pending',
          totalAmount: 100.00,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockResult = {
        orders: mockOrders,
        total: 1,
        totalRevenue: 100.00,
        hasMore: false
      };

      mockOrderService.getOrders.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/orders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.orders).toEqual(mockOrders);
      expect(data.total).toBe(1);
      expect(data.totalRevenue).toBe(100.00);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        'user-1'
      );
    });

    it('should filter orders by status', async () => {
      // Arrange
      const mockResult = {
        orders: [],
        total: 0,
        totalRevenue: 0,
        hasMore: false
      };

      mockOrderService.getOrders.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/orders?status=pending');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending'
        }),
        'user-1'
      );
    });

    it('should filter orders by business owner', async () => {
      // Arrange
      const mockResult = {
        orders: [],
        total: 0,
        totalRevenue: 0,
        hasMore: false
      };

      mockOrderService.getOrders.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/orders?businessOwnerId=business-1');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          businessOwnerId: 'business-1'
        }),
        'user-1'
      );
    });

    it('should limit results', async () => {
      // Arrange
      const mockResult = {
        orders: [],
        total: 0,
        totalRevenue: 0,
        hasMore: false
      };

      mockOrderService.getOrders.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/orders?limit=10');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10
        }),
        'user-1'
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockOrderService.getOrders.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/orders');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
      // Arrange
      const orderData = {
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

      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        ...orderData,
        subtotal: 50.00,
        tax: 4.00,
        totalAmount: 63.99,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.order).toEqual(mockOrder);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'user-1',
          businessOwnerId: 'business-1'
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockOrderService.createOrder.mockRejectedValue(new Error('Service error'));

      const orderData = {
        businessOwnerId: 'business-1',
        items: [{ productId: 'product-1', quantity: 1, price: 25.00 }],
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
        paymentMethod: 'card'
      };

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
