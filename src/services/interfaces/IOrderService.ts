import { Order } from '@/types/firebase';

export interface CreateOrderData {
  customerId: string;
  businessOwnerId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  notes?: string;
  shippingCost?: number;
}

export interface UpdateOrderData {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  notes?: string;
  carrier?: string;
  estimatedDelivery?: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  customizations?: Record<string, string>;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderSearchOptions {
  customerId?: string;
  businessOwnerId?: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSearchResult {
  orders: Order[];
  total: number;
  totalRevenue: number;
  hasMore: boolean;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
  recentOrders: Order[];
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IOrderService {
  // Order CRUD operations
  createOrder(data: CreateOrderData): Promise<Order>;
  updateOrder(orderId: string, data: UpdateOrderData, userId: string): Promise<Order>;
  deleteOrder(orderId: string, userId: string): Promise<void>;
  getOrder(orderId: string, userId: string): Promise<Order | null>;
  getOrders(options: OrderSearchOptions, userId: string): Promise<OrderSearchResult>;

  // Order management
  updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled', userId: string): Promise<Order>;
  updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded', userId: string): Promise<Order>;
  addTrackingNumber(orderId: string, trackingNumber: string, carrier?: string, userId?: string): Promise<Order>;
  cancelOrder(orderId: string, userId: string): Promise<Order>;

  // Customer operations
  getCustomerOrders(customerId: string, options?: OrderSearchOptions): Promise<OrderSearchResult>;
  getCustomerOrderStats(customerId: string): Promise<OrderStats>;

  // Business owner operations
  getBusinessOwnerOrders(businessOwnerId: string, options?: OrderSearchOptions): Promise<OrderSearchResult>;
  getBusinessOwnerOrderStats(businessOwnerId: string): Promise<OrderStats>;

  // Admin operations
  getAllOrders(options?: OrderSearchOptions): Promise<OrderSearchResult>;
  getOrderStats(filters?: OrderSearchOptions): Promise<OrderStats>;
  getRecentOrders(limit?: number): Promise<Order[]>;

  // Validation
  validateOrderData(data: CreateOrderData): Promise<OrderValidationResult>;
  validateOrderUpdate(data: UpdateOrderData): Promise<OrderValidationResult>;

  // Status transitions
  canUpdateStatus(currentStatus: string, newStatus: string): boolean;
  getValidStatusTransitions(currentStatus: string): string[];

  // Analytics
  getOrdersByProduct(productId: string): Promise<Order[]>;
  getOrdersByDateRange(dateFrom: Date, dateTo: Date): Promise<Order[]>;
  getOrdersByAmountRange(minAmount: number, maxAmount: number): Promise<Order[]>;
}


