import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/orders/[id]/route';
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

describe('/api/orders/[id]', () => {
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

  describe('GET /api/orders/[id]', () => {
    it('should return order for authenticated user', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-1',
        customerId: 'user-1',
        businessOwnerId: 'business-1',
        status: 'pending',
        totalAmount: 100.00,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderService.getOrder.mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const params = { id: 'order-1' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.order).toEqual(mockOrder);
      expect(mockOrderService.getOrder).toHaveBeenCalledWith('order-1', 'user-1');
    });

    it('should return 404 for non-existent order', async () => {
      // Arrange
      mockOrderService.getOrder.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/non-existent');
      const params = { id: 'non-existent' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Order not found');
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const params = { id: 'order-1' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockOrderService.getOrder.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const params = { id: 'order-1' };

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/orders/[id]', () => {
    it('should update order successfully', async () => {
      // Arrange
      const updateData = {
        status: 'processing',
        notes: 'Updated notes'
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        customerId: 'user-1',
        businessOwnerId: 'business-1',
        status: 'processing',
        notes: 'Updated notes',
        totalAmount: 100.00,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderService.updateOrder.mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      const params = { id: 'order-1' };

      // Act
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.order).toEqual(mockUpdatedOrder);
      expect(mockOrderService.updateOrder).toHaveBeenCalledWith(
        'order-1',
        updateData,
        'user-1'
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'PUT',
        body: JSON.stringify({})
      });
      const params = { id: 'order-1' };

      // Act
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockOrderService.updateOrder.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'processing' })
      });
      const params = { id: 'order-1' };

      // Act
      const response = await PUT(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/orders/[id]', () => {
    it('should cancel order successfully', async () => {
      // Arrange
      const mockCancelledOrder = {
        id: 'order-1',
        customerId: 'user-1',
        businessOwnerId: 'business-1',
        status: 'cancelled',
        totalAmount: 100.00,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockOrderService.cancelOrder.mockResolvedValue(mockCancelledOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'DELETE'
      });
      const params = { id: 'order-1' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.order).toEqual(mockCancelledOrder);
      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('order-1', 'user-1');
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'DELETE'
      });
      const params = { id: 'order-1' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle service errors', async () => {
      // Arrange
      mockOrderService.cancelOrder.mockRejectedValue(new Error('Service error'));

      const request = new NextRequest('http://localhost:3000/api/orders/order-1', {
        method: 'DELETE'
      });
      const params = { id: 'order-1' };

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});


