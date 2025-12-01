import { Timestamp } from 'firebase-admin/firestore';
import { BaseDocument } from './firebase';

export type DiscountType = 'percentage' | 'fixed_amount';
export type DiscountScope = 'product' | 'category' | 'order' | 'shipping';
export type DiscountStatus = 'active' | 'inactive' | 'expired';

export interface Discount extends BaseDocument {
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  scope: DiscountScope;
  targetIds?: string[]; // Product IDs, category IDs, or empty for order-level
  minOrderAmount?: number;
  maxDiscountAmount?: number; // Maximum discount cap (for percentage discounts)
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  status: DiscountStatus;
  createdBy: string; // User ID (admin or shop owner)
  businessOwnerId?: string; // If created by shop owner, their business ID
  applicableUserIds?: string[]; // If restricted to specific users
  usageLimit?: number; // Total usage limit
  usedCount: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface CouponCode extends BaseDocument {
  code: string; // Unique coupon code
  discountId: string; // Reference to Discount
  name?: string;
  description?: string;
  usageLimit?: number; // Total usage limit
  usedCount: number;
  perUserLimit?: number; // Usage limit per user
  applicableUserIds?: string[]; // If restricted to specific users
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  status: 'active' | 'inactive' | 'expired';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface AppliedDiscount {
  discountId: string;
  couponCode?: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number; // Calculated discount amount
  scope: DiscountScope;
  targetIds?: string[];
}

export interface DiscountValidationResult {
  isValid: boolean;
  discount?: Discount;
  coupon?: CouponCode;
  error?: string;
  discountAmount?: number;
}

export interface CreateDiscountData {
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  targetIds?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date | string;
  endDate: Date | string;
  applicableUserIds?: string[];
  usageLimit?: number;
  businessOwnerId?: string;
}

export interface UpdateDiscountData {
  name?: string;
  description?: string;
  type?: DiscountType;
  value?: number;
  scope?: DiscountScope;
  targetIds?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: DiscountStatus;
  applicableUserIds?: string[];
  usageLimit?: number;
}

export interface CreateCouponData {
  code: string;
  discountId: string;
  name?: string;
  description?: string;
  usageLimit?: number;
  perUserLimit?: number;
  applicableUserIds?: string[];
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface CouponValidationRequest {
  code: string;
  userId?: string;
  orderAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  cartItems?: Array<{
    productId: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}



