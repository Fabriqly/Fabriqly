import { DiscountRepository } from '@/repositories/DiscountRepository';
import { Discount, DiscountType, DiscountValidationResult, CreateDiscountData, UpdateDiscountData } from '@/types/promotion';
import { Timestamp } from 'firebase-admin/firestore';

export class DiscountService {
  private discountRepo: DiscountRepository;

  constructor() {
    this.discountRepo = new DiscountRepository();
  }

  /**
   * Calculate discount amount based on type, scope, and applicable amount
   */
  calculateDiscount(
    discount: Discount,
    orderAmount: number,
    applicableAmount?: number, // For product/category scoped discounts
    shippingCost?: number // For shipping scoped discounts
  ): number {
    let amountToDiscount: number;

    // Determine the amount to apply discount to based on scope
    if (discount.scope === 'shipping') {
      // Shipping discounts apply only to shipping cost
      amountToDiscount = shippingCost !== undefined ? shippingCost : 0;
      console.log('[DiscountService] Shipping discount - shippingCost:', shippingCost, 'amountToDiscount:', amountToDiscount);
    } else if (discount.scope === 'product' || discount.scope === 'category') {
      // Product/category discounts apply to the applicable amount (matching products/categories)
      amountToDiscount = applicableAmount !== undefined ? applicableAmount : 0;
      console.log('[DiscountService] Product/Category discount - applicableAmount:', applicableAmount, 'amountToDiscount:', amountToDiscount);
    } else {
      // Order-level discounts apply to the entire order amount
      amountToDiscount = orderAmount;
      console.log('[DiscountService] Order-level discount - orderAmount:', orderAmount, 'amountToDiscount:', amountToDiscount);
    }

    let discountAmount = 0;

    if (discount.type === 'percentage') {
      discountAmount = (amountToDiscount * discount.value) / 100;
      console.log('[DiscountService] Percentage discount - value:', discount.value, 'calculated:', discountAmount);
      
      // Apply maximum discount cap if set
      if (discount.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
        console.log('[DiscountService] Applied max discount cap:', discount.maxDiscountAmount, 'final:', discountAmount);
      }
    } else if (discount.type === 'fixed_amount') {
      discountAmount = Math.min(discount.value, amountToDiscount);
      console.log('[DiscountService] Fixed amount discount - value:', discount.value, 'amountToDiscount:', amountToDiscount, 'final:', discountAmount);
    }

    const finalAmount = Math.max(0, discountAmount);
    console.log('[DiscountService] Final discount amount:', finalAmount, 'for scope:', discount.scope);
    return finalAmount;
  }

  /**
   * Get all applicable discounts for a cart/order
   */
  async getApplicableDiscounts(options: {
    productIds?: string[];
    categoryIds?: string[];
    orderAmount?: number;
    userId?: string;
    businessOwnerId?: string;
  }): Promise<Discount[]> {
    return this.discountRepo.findApplicableDiscounts(options);
  }

  /**
   * Validate if a discount can be applied
   */
  async validateDiscount(
    discountId: string,
    options: {
      orderAmount?: number;
      userId?: string;
      productIds?: string[];
      categoryIds?: string[];
    }
  ): Promise<DiscountValidationResult> {
    const discount = await this.discountRepo.findById(discountId);

    if (!discount) {
      return {
        isValid: false,
        error: 'Discount not found'
      };
    }

    // Check status
    if (discount.status !== 'active') {
      return {
        isValid: false,
        discount,
        error: 'Discount is not active'
      };
    }

    // Check dates
    const now = Timestamp.now();
    const startDate = discount.startDate instanceof Timestamp
      ? discount.startDate
      : Timestamp.fromDate(new Date(discount.startDate));
    const endDate = discount.endDate instanceof Timestamp
      ? discount.endDate
      : Timestamp.fromDate(new Date(discount.endDate));

    if (startDate > now) {
      return {
        isValid: false,
        discount,
        error: 'Discount has not started yet'
      };
    }

    if (endDate < now) {
      return {
        isValid: false,
        discount,
        error: 'Discount has expired'
      };
    }

    // Check minimum order amount
    if (discount.minOrderAmount && options.orderAmount !== undefined) {
      if (options.orderAmount < discount.minOrderAmount) {
        return {
          isValid: false,
          discount,
          error: `Minimum order amount of ${discount.minOrderAmount} required`
        };
      }
    }

    // Check user restrictions
    if (discount.applicableUserIds && discount.applicableUserIds.length > 0 && options.userId) {
      if (!discount.applicableUserIds.includes(options.userId)) {
        return {
          isValid: false,
          discount,
          error: 'Discount is not applicable to this user'
        };
      }
    }

    // Check usage limit
    if (discount.usageLimit) {
      if ((discount.usedCount || 0) >= discount.usageLimit) {
        return {
          isValid: false,
          discount,
          error: 'Discount has reached its usage limit'
        };
      }
    }

    // Calculate discount amount
    const discountAmount = this.calculateDiscount(
      discount,
      options.orderAmount || 0
    );

    return {
      isValid: true,
      discount,
      discountAmount
    };
  }

  /**
   * Apply discount to order calculation
   */
  async applyDiscountToOrder(
    discountId: string,
    orderAmount: number,
    applicableAmount?: number
  ): Promise<{ discountAmount: number; discount: Discount | null }> {
    const discount = await this.discountRepo.findById(discountId);
    
    if (!discount) {
      return { discountAmount: 0, discount: null };
    }

    const discountAmount = this.calculateDiscount(discount, orderAmount, applicableAmount);

    // Increment usage count
    await this.discountRepo.incrementUsage(discountId);

    return { discountAmount, discount };
  }

  /**
   * Create a new discount
   */
  async createDiscount(data: CreateDiscountData, createdBy: string): Promise<Discount> {
    const now = Timestamp.now();
    
    // Validate and convert dates
    const parseDate = (dateInput: string | Date): Timestamp => {
      let date: Date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else {
        throw new Error('Invalid date format');
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date value');
      }
      
      return Timestamp.fromDate(date);
    };
    
    const discountData: Omit<Discount, 'id'> = {
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      scope: data.scope,
      targetIds: data.targetIds || [],
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
      status: 'active',
      createdBy,
      businessOwnerId: data.businessOwnerId,
      applicableUserIds: data.applicableUserIds || [],
      usageLimit: data.usageLimit,
      usedCount: 0,
      createdAt: now,
      updatedAt: now
    };

    return this.discountRepo.create(discountData);
  }

  /**
   * Update a discount
   */
  async updateDiscount(discountId: string, data: UpdateDiscountData): Promise<Discount> {
    const updateData: Partial<Discount> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.scope !== undefined) updateData.scope = data.scope;
    if (data.targetIds !== undefined) updateData.targetIds = data.targetIds;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.applicableUserIds !== undefined) updateData.applicableUserIds = data.applicableUserIds;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate instanceof Date
        ? Timestamp.fromDate(data.startDate)
        : Timestamp.fromDate(new Date(data.startDate));
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate instanceof Date
        ? Timestamp.fromDate(data.endDate)
        : Timestamp.fromDate(new Date(data.endDate));
    }

    updateData.updatedAt = Timestamp.now();

    return this.discountRepo.update(discountId, updateData);
  }

  /**
   * Delete a discount
   */
  async deleteDiscount(discountId: string): Promise<void> {
    await this.discountRepo.delete(discountId);
  }

  /**
   * Get discount by ID
   */
  async getDiscountById(discountId: string): Promise<Discount | null> {
    return this.discountRepo.findById(discountId);
  }

  /**
   * Get all discounts with optional filters
   */
  async getAllDiscounts(options?: {
    scope?: string;
    status?: string;
    businessOwnerId?: string;
    createdBy?: string;
  }): Promise<Discount[]> {
    const filters: any[] = [];

    if (options?.scope) {
      filters.push({ field: 'scope', operator: '==', value: options.scope });
    }

    if (options?.status) {
      filters.push({ field: 'status', operator: '==', value: options.status });
    }

    if (options?.businessOwnerId) {
      filters.push({ field: 'businessOwnerId', operator: '==', value: options.businessOwnerId });
    }

    if (options?.createdBy) {
      filters.push({ field: 'createdBy', operator: '==', value: options.createdBy });
    }

    return this.discountRepo.findAll({
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }
}

