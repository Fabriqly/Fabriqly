import { BaseRepository, QueryFilter } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Order } from '@/types/firebase';

export interface OrderFilters {
  customerId?: string;
  businessOwnerId?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  recentOrders: Order[];
}

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(Collections.ORDERS);
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.findAll({
      filters: [{ field: 'customerId', operator: '==', value: customerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByBusinessOwner(businessOwnerId: string): Promise<Order[]> {
    return this.findAll({
      filters: [{ field: 'businessOwnerId', operator: '==', value: businessOwnerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByStatus(status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<Order[]> {
    return this.findAll({
      filters: [{ field: 'status', operator: '==', value: status }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByPaymentStatus(paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'): Promise<Order[]> {
    return this.findAll({
      filters: [{ field: 'paymentStatus', operator: '==', value: paymentStatus }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Order[]> {
    return this.findAll({
      filters: [
        { field: 'createdAt', operator: '>=', value: dateFrom },
        { field: 'createdAt', operator: '<=', value: dateTo }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Order[]> {
    return this.findAll({
      filters: [
        { field: 'totalAmount', operator: '>=', value: minAmount },
        { field: 'totalAmount', operator: '<=', value: maxAmount }
      ],
      orderBy: { field: 'totalAmount', direction: 'desc' }
    });
  }

  async findWithFilters(filters: OrderFilters, sortBy?: string, sortOrder?: 'asc' | 'desc', limit?: number): Promise<Order[]> {
    const queryFilters: QueryFilter[] = [];

    if (filters.customerId) {
      queryFilters.push({ field: 'customerId', operator: '==', value: filters.customerId });
    }

    if (filters.businessOwnerId) {
      queryFilters.push({ field: 'businessOwnerId', operator: '==', value: filters.businessOwnerId });
    }

    if (filters.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status });
    }

    if (filters.paymentStatus) {
      queryFilters.push({ field: 'paymentStatus', operator: '==', value: filters.paymentStatus });
    }

    if (filters.dateFrom) {
      queryFilters.push({ field: 'createdAt', operator: '>=', value: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryFilters.push({ field: 'createdAt', operator: '<=', value: filters.dateTo });
    }

    if (filters.minAmount) {
      queryFilters.push({ field: 'totalAmount', operator: '>=', value: filters.minAmount });
    }

    if (filters.maxAmount) {
      queryFilters.push({ field: 'totalAmount', operator: '<=', value: filters.maxAmount });
    }

    const options: any = { filters: queryFilters };
    
    if (sortBy) {
      options.orderBy = { field: sortBy, direction: sortOrder || 'desc' };
    } else {
      options.orderBy = { field: 'createdAt', direction: 'desc' };
    }
    
    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  }

  async getOrderStats(filters?: OrderFilters): Promise<OrderStats> {
    const orders = await this.findWithFilters(filters || {});
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByPaymentStatus = orders.reduce((acc, order) => {
      acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentOrders = orders.slice(0, 10);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByPaymentStatus,
      recentOrders
    };
  }

  async getCustomerOrderCount(customerId: string): Promise<number> {
    return this.count([{ field: 'customerId', operator: '==', value: customerId }]);
  }

  async getBusinessOwnerOrderCount(businessOwnerId: string): Promise<number> {
    return this.count([{ field: 'businessOwnerId', operator: '==', value: businessOwnerId }]);
  }

  async getCustomerTotalSpent(customerId: string): Promise<number> {
    const orders = await this.findByCustomer(customerId);
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  async getBusinessOwnerTotalRevenue(businessOwnerId: string): Promise<number> {
    const orders = await this.findByBusinessOwner(businessOwnerId);
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.findByStatus('pending');
  }

  async getProcessingOrders(): Promise<Order[]> {
    return this.findByStatus('processing');
  }

  async getShippedOrders(): Promise<Order[]> {
    return this.findByStatus('shipped');
  }

  async getDeliveredOrders(): Promise<Order[]> {
    return this.findByStatus('delivered');
  }

  async getCancelledOrders(): Promise<Order[]> {
    return this.findByStatus('cancelled');
  }

  async getOrdersByTrackingNumber(trackingNumber: string): Promise<Order[]> {
    return this.findAll({
      filters: [{ field: 'trackingNumber', operator: '==', value: trackingNumber }]
    });
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    return this.findAll({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }

  async getOrdersByProduct(productId: string): Promise<Order[]> {
    // Note: This requires a more complex query since productId is nested in items array
    // For now, we'll get all orders and filter in the service layer
    const allOrders = await this.findAll({
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    
    return allOrders.filter(order => 
      order.items.some(item => item.productId === productId)
    );
  }

  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<Order> {
    return this.update(orderId, { 
      status, 
      updatedAt: new Date() 
    });
  }

  async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'): Promise<Order> {
    return this.update(orderId, { 
      paymentStatus, 
      updatedAt: new Date() 
    });
  }

  async addTrackingNumber(orderId: string, trackingNumber: string): Promise<Order> {
    return this.update(orderId, { 
      trackingNumber, 
      status: 'shipped',
      updatedAt: new Date() 
    });
  }
}


