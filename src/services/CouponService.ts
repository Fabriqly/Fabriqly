import { CouponRepository } from '@/repositories/CouponRepository';
import { DiscountRepository } from '@/repositories/DiscountRepository';
import { OrderRepository } from '@/repositories/OrderRepository';
import { DiscountService } from './DiscountService';
import { CouponCode, DiscountValidationResult, CreateCouponData, CouponValidationRequest } from '@/types/promotion';
import { Timestamp } from 'firebase-admin/firestore';

export class CouponService {
  private couponRepo: CouponRepository;
  private discountRepo: DiscountRepository;
  private orderRepo: OrderRepository;
  private discountService: DiscountService;

  constructor() {
    this.couponRepo = new CouponRepository();
    this.discountRepo = new DiscountRepository();
    this.orderRepo = new OrderRepository();
    this.discountService = new DiscountService();
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(
    request: CouponValidationRequest & { shippingCost?: number }
  ): Promise<DiscountValidationResult> {
    const { code, userId, orderAmount, productIds, categoryIds, shippingCost, cartItems } = request;

    // Find coupon by code
    const coupon = await this.couponRepo.findByCode(code);

    if (!coupon) {
      return {
        isValid: false,
        error: 'Coupon code not found'
      };
    }

    // Validate coupon itself
    const couponValidation = await this.couponRepo.validateCoupon(code, {
      userId,
      orderAmount
    });

    if (!couponValidation.isValid) {
      return {
        isValid: false,
        coupon,
        error: couponValidation.error
      };
    }

    // Get the associated discount
    const discount = await this.discountRepo.findById(coupon.discountId);

    if (!discount) {
      return {
        isValid: false,
        coupon,
        error: 'Discount associated with coupon not found'
      };
    }

    // Validate the discount
    const discountValidation = await this.discountService.validateDiscount(
      discount.id,
      {
        orderAmount,
        userId,
        productIds,
        categoryIds
      }
    );

    if (!discountValidation.isValid) {
      return {
        isValid: false,
        coupon,
        discount,
        error: discountValidation.error
      };
    }

    // Calculate applicableAmount for product/category scoped discounts
    let applicableAmount: number | undefined = undefined;
    
    if (discount.scope === 'product' || discount.scope === 'category') {
      if (cartItems && discount.targetIds && discount.targetIds.length > 0) {
        // Calculate the total of matching items
        if (discount.scope === 'product') {
          // For product scope, sum items where productId matches targetIds
          applicableAmount = cartItems
            .filter(item => discount.targetIds?.includes(item.productId))
            .reduce((sum, item) => sum + item.totalPrice, 0);
        } else if (discount.scope === 'category') {
          // For category scope, we need categoryIds - but we don't have them in cartItems
          // So we'll need to fetch products or pass categoryIds separately
          // For now, if categoryIds are provided, we can use them
          // But we need product prices for matching categories
          // This is a limitation - we'd need to fetch products to get their categories
          // For now, use orderAmount as fallback if categoryIds are provided
          if (categoryIds && categoryIds.length > 0) {
            // We can't calculate exact amount without fetching products
            // So we'll use orderAmount as approximation
            applicableAmount = orderAmount || 0;
          }
        }
      } else if (!discount.targetIds || discount.targetIds.length === 0) {
        // If product/category discount has no targetIds, treat it as order-level
        // This is a fallback for discounts that were created without targetIds
        console.log('[CouponService] Product/Category discount has no targetIds, treating as order-level:', discount.id, discount.name);
        applicableAmount = orderAmount || 0;
      }
      
      console.log('[CouponService] Calculated applicableAmount:', {
        scope: discount.scope,
        targetIds: discount.targetIds,
        targetIdsCount: discount.targetIds?.length || 0,
        applicableAmount,
        cartItemsCount: cartItems?.length,
        orderAmount
      });
    }

    // Calculate discount amount based on scope
    // For shipping scope, use shippingCost if provided
    // For product/category scope, use calculated applicableAmount
    const discountAmount = this.discountService.calculateDiscount(
      discount,
      orderAmount || 0,
      applicableAmount, // Use calculated applicableAmount for product/category scopes
      shippingCost // Pass shippingCost for shipping scope discounts
    );

    return {
      isValid: true,
      coupon,
      discount,
      discountAmount
    };
  }

  /**
   * Apply coupon to cart/order
   */
  async applyCoupon(
    code: string,
    options: {
      userId?: string;
      orderAmount?: number;
      productIds?: string[];
      categoryIds?: string[];
      shippingCost?: number;
      applicableAmount?: number; // For product/category scoped discounts
    }
  ): Promise<{
    success: boolean;
    coupon?: CouponCode;
    discount?: any;
    discountAmount?: number;
    error?: string;
  }> {
    const validation = await this.validateCoupon({
      code,
      userId: options.userId,
      orderAmount: options.orderAmount,
      productIds: options.productIds,
      categoryIds: options.categoryIds,
      shippingCost: options.shippingCost // Pass shippingCost for scope-aware validation
    });

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Calculate discount amount with scope awareness
    if (validation.discount) {
      const discountAmount = this.discountService.calculateDiscount(
        validation.discount,
        options.orderAmount || 0,
        options.applicableAmount,
        options.shippingCost
      );

      console.log('[CouponService] Calculated discount amount:', {
        scope: validation.discount.scope,
        type: validation.discount.type,
        value: validation.discount.value,
        orderAmount: options.orderAmount,
        applicableAmount: options.applicableAmount,
        shippingCost: options.shippingCost,
        discountAmount
      });

      // Increment coupon usage
      if (validation.coupon) {
        await this.couponRepo.incrementUsage(validation.coupon.id, options.userId);
      }

      // Increment discount usage
      await this.discountRepo.incrementUsage(validation.discount.id);

      return {
        success: true,
        coupon: validation.coupon,
        discount: validation.discount,
        discountAmount
      };
    }

    return {
      success: false,
      error: 'Discount not found'
    };
  }

  /**
   * Get discount details from coupon
   */
  async getCouponDiscount(couponId: string): Promise<any | null> {
    const coupon = await this.couponRepo.findById(couponId);
    
    if (!coupon) {
      return null;
    }

    const discount = await this.discountRepo.findById(coupon.discountId);
    return discount;
  }

  /**
   * Create a new coupon code
   */
  async createCoupon(data: CreateCouponData): Promise<CouponCode> {
    // Verify discount exists
    const discount = await this.discountRepo.findById(data.discountId);
    if (!discount) {
      throw new Error('Discount not found');
    }

    // Check if code already exists
    const existingCoupon = await this.couponRepo.findByCode(data.code);
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    const now = Timestamp.now();
    const couponData: Omit<CouponCode, 'id'> = {
      code: data.code.toUpperCase(),
      discountId: data.discountId,
      name: data.name,
      description: data.description,
      usageLimit: data.usageLimit,
      usedCount: 0,
      perUserLimit: data.perUserLimit,
      applicableUserIds: data.applicableUserIds || [],
      startDate: data.startDate
        ? (data.startDate instanceof Date
            ? Timestamp.fromDate(data.startDate)
            : Timestamp.fromDate(new Date(data.startDate)))
        : undefined,
      endDate: data.endDate
        ? (data.endDate instanceof Date
            ? Timestamp.fromDate(data.endDate)
            : Timestamp.fromDate(new Date(data.endDate)))
        : undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    return this.couponRepo.create(couponData);
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<CouponCode | null> {
    return this.couponRepo.findByCode(code);
  }

  /**
   * Get coupons by discount ID
   */
  async getCouponsByDiscountId(discountId: string): Promise<CouponCode[]> {
    return this.couponRepo.findByDiscountId(discountId);
  }

  /**
   * Get the number of times a user has used a specific coupon
   */
  async getUserCouponUsageCount(couponCode: string, userId: string): Promise<number> {
    try {
      const orders = await this.orderRepo.findWithFilters({
        customerId: userId
      });
      
      // Count orders where the user used this coupon code
      const usageCount = orders.filter(order => 
        order.appliedCouponCode?.toUpperCase() === couponCode.toUpperCase()
      ).length;
      
      return usageCount;
    } catch (error) {
      console.error('[CouponService] Error getting user coupon usage:', error);
      return 0; // Return 0 on error to be safe
    }
  }

  /**
   * Filter coupons to only include valid, usable ones
   * Checks status, dates, usage limits, and per-user usage limits
   */
  async filterValidCoupons(coupons: CouponCode[], userId?: string): Promise<CouponCode[]> {
    const now = Timestamp.now();
    
    // Filter coupons asynchronously - need to use Promise.all since we're checking per-user usage
    const validationResults = await Promise.all(
      coupons.map(async (coupon) => {
        // Check status
        if (coupon.status !== 'active') {
          console.log('[CouponService] Coupon filtered - not active:', coupon.code, 'status:', coupon.status);
          return { coupon, isValid: false };
        }

        // Check expiration dates
        let startDate: Timestamp | null = null;
        let endDate: Timestamp | null = null;

        // Parse startDate
        if (coupon.startDate) {
          if (coupon.startDate instanceof Timestamp) {
            startDate = coupon.startDate;
          } else if (coupon.startDate instanceof Date) {
            startDate = Timestamp.fromDate(coupon.startDate);
          } else if (typeof coupon.startDate === 'object') {
            const seconds = (coupon.startDate as any)._seconds || (coupon.startDate as any).seconds;
            const nanoseconds = (coupon.startDate as any)._nanoseconds || (coupon.startDate as any).nanoseconds || 0;
            if (typeof seconds === 'number') {
              startDate = new Timestamp(seconds, nanoseconds);
            }
          } else if (typeof coupon.startDate === 'string') {
            startDate = Timestamp.fromDate(new Date(coupon.startDate));
          }
        }

        // Parse endDate
        if (coupon.endDate) {
          if (coupon.endDate instanceof Timestamp) {
            endDate = coupon.endDate;
          } else if (coupon.endDate instanceof Date) {
            endDate = Timestamp.fromDate(coupon.endDate);
          } else if (typeof coupon.endDate === 'object') {
            const seconds = (coupon.endDate as any)._seconds || (coupon.endDate as any).seconds;
            const nanoseconds = (coupon.endDate as any)._nanoseconds || (coupon.endDate as any).nanoseconds || 0;
            if (typeof seconds === 'number') {
              endDate = new Timestamp(seconds, nanoseconds);
            }
          } else if (typeof coupon.endDate === 'string') {
            endDate = Timestamp.fromDate(new Date(coupon.endDate));
          }
        }

        const now = Timestamp.now();

        // Check if coupon is within valid date range
        if (startDate && startDate > now) {
          console.log('[CouponService] Coupon filtered - not started yet:', coupon.code, 
            'startDate:', startDate.toDate().toISOString(), 
            'now:', now.toDate().toISOString());
          return { coupon, isValid: false };
        }
        if (endDate && endDate < now) {
          console.log('[CouponService] Coupon filtered - expired:', coupon.code, 
            'endDate:', endDate.toDate().toISOString(), 
            'now:', now.toDate().toISOString());
          return { coupon, isValid: false };
        }

        // Check total usage limit
        if (coupon.usageLimit) {
          if ((coupon.usedCount || 0) >= coupon.usageLimit) {
            console.log('[CouponService] Coupon filtered - usage limit reached:', coupon.code, 
              'usedCount:', coupon.usedCount, 
              'usageLimit:', coupon.usageLimit);
            return { coupon, isValid: false };
          }
        }

        // Check user restrictions (if applicableUserIds is set, user must be in the list)
        if (coupon.applicableUserIds && coupon.applicableUserIds.length > 0 && userId) {
          if (!coupon.applicableUserIds.includes(userId)) {
            console.log('[CouponService] Coupon filtered - user not applicable:', coupon.code, 
              'userId:', userId, 
              'applicableUserIds:', coupon.applicableUserIds);
            return { coupon, isValid: false };
          }
        }

        // Check per-user usage limit
        if (coupon.perUserLimit && userId) {
          const userUsageCount = await this.getUserCouponUsageCount(coupon.code, userId);
          if (userUsageCount >= coupon.perUserLimit) {
            console.log('[CouponService] Coupon filtered - per-user limit reached:', coupon.code, 
              'userId:', userId, 
              'userUsageCount:', userUsageCount, 
              'perUserLimit:', coupon.perUserLimit);
            return { coupon, isValid: false };
          }
        }

        console.log('[CouponService] ✓ Coupon is valid:', coupon.code);
        return { coupon, isValid: true };
      })
    );

    return validationResults
      .filter(result => result.isValid)
      .map(result => result.coupon);
  }

  /**
   * Get all coupons
   */
  async getAllCoupons(): Promise<CouponCode[]> {
    return this.couponRepo.findAll({
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Check if coupon code exists
   */
  async codeExists(code: string): Promise<boolean> {
    return this.couponRepo.codeExists(code);
  }

  /**
   * Generate a unique coupon code
   */
  async generateUniqueCode(prefix: string = 'PROMO', length: number = 8): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = prefix + '-' + Array.from({ length }, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
      attempts++;
    } while (await this.codeExists(code) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique coupon code');
    }

    return code;
  }
}

