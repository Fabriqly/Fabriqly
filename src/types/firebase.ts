import { Timestamp } from 'firebase-admin/firestore';

// Base interface for all documents
export interface BaseDocument {
  id: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// User types
export interface User extends BaseDocument {
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'customer' | 'designer' | 'business_owner' | 'admin';
  isVerified: boolean;  
  profile: UserProfile;
  shippingAddresses?: SavedAddress[];
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  preferences?: UserPreferences;
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

export interface SavedAddress extends Address {
  id: string;
  isDefault?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark';
}

// Product types
export interface Product extends BaseDocument {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  shopId: string;
  designerId?: string;
  isActive: boolean;
  inventory: number;
  tags: string[];
  customizationOptions?: CustomizationOption[];
}

export interface CustomizationOption {
  name: string;
  type: 'color' | 'size' | 'text' | 'image';
  options: string[];
  required: boolean;
  additionalPrice?: number;
}

// Order types
export interface Order extends BaseDocument {
  customerId: string;
  businessOwnerId: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  notes?: string;
  statusHistory?: OrderStatusHistory[];
  appliedDiscounts?: Array<{
    discountId: string;
    couponCode?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    discountAmount: number;
    scope: 'product' | 'category' | 'order' | 'shipping';
    targetIds?: string[];
  }>;
  appliedCouponCode?: string;
}

export interface OrderStatusHistory {
  status: 'pending' | 'processing' | 'to_ship' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: Timestamp;
  updatedBy?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  customizations?: Record<string, string>;
}

// Design types
export interface Design extends BaseDocument {
  name: string;
  description: string;
  designerId: string;
  category: string;
  images: string[];
  files: DesignFile[];
  isPublic: boolean;
  price?: number;
  tags: string[];
  likes: number;
  downloads: number;
}

export interface DesignFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

// Shop types
export interface Shop extends BaseDocument {
  name: string;
  description: string;
  ownerId: string;
  logo?: string;
  banner?: string;
  isActive: boolean;
  settings: ShopSettings;
  stats: ShopStats;
}

export interface ShopSettings {
  allowCustomOrders: boolean;
  processingTime: string;
  returnPolicy: string;
  shippingPolicy: string;
}

export interface ShopStats {
  totalSales: number;
  totalOrders: number;
  averageRating: number;
  totalReviews: number;
}

// Review types
export interface ReviewReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'shop_owner' | 'designer' | 'admin';
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review extends BaseDocument {
  productId?: string;
  shopId?: string;
  designerId?: string;
  designId?: string;
  customizationRequestId?: string;
  customerId: string;
  customerName?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  reviewType: 'product' | 'shop' | 'designer' | 'design' | 'customization';
  reply?: ReviewReply;
}

// Message types
export interface Message extends BaseDocument {
  senderId: string;
  receiverId: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  isFinalDesign?: boolean;  // Designer marks this as the final design
}

export interface Conversation extends BaseDocument {
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date | Timestamp;
  unreadCount: Record<string, number>;
}
