import { BaseRepository } from './BaseRepository';
import { Discount, DiscountScope, DiscountStatus } from '@/types/promotion';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export class DiscountRepository extends BaseRepository<Discount> {
  constructor() {
    super(Collections.DISCOUNTS);
  }

  /**
   * Find active discounts by scope
   */
  async findActiveByScope(scope: DiscountScope): Promise<Discount[]> {
    const now = Timestamp.now();
    return this.findAll({
      filters: [
        { field: 'scope', operator: '==', value: scope },
        { field: 'status', operator: '==', value: 'active' },
        { field: 'startDate', operator: '<=', value: now },
        { field: 'endDate', operator: '>=', value: now }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find discounts applicable to a specific product
   */
  async findByProductId(productId: string): Promise<Discount[]> {
    const now = Timestamp.now();
    return this.findAll({
      filters: [
        {
          field: 'scope',
          operator: 'in',
          value: ['product', 'order']
        },
        { field: 'status', operator: '==', value: 'active' },
        { field: 'startDate', operator: '<=', value: now },
        { field: 'endDate', operator: '>=', value: now }
      ]
    }).then(discounts => {
      return discounts.filter(discount => {
        if (discount.scope === 'order') {
          return true; // Order-level discounts apply to all products
        }
        if (discount.scope === 'product') {
          return discount.targetIds?.includes(productId) || false;
        }
        return false;
      });
    });
  }

  /**
   * Find discounts applicable to a specific category
   */
  async findByCategoryId(categoryId: string): Promise<Discount[]> {
    const now = Timestamp.now();
    return this.findAll({
      filters: [
        {
          field: 'scope',
          operator: 'in',
          value: ['category', 'order']
        },
        { field: 'status', operator: '==', value: 'active' },
        { field: 'startDate', operator: '<=', value: now },
        { field: 'endDate', operator: '>=', value: now }
      ]
    }).then(discounts => {
      return discounts.filter(discount => {
        if (discount.scope === 'order') {
          return true; // Order-level discounts apply to all categories
        }
        if (discount.scope === 'category') {
          return discount.targetIds?.includes(categoryId) || false;
        }
        return false;
      });
    });
  }

  /**
   * Find all applicable discounts for a cart/order
   */
  async findApplicableDiscounts(options: {
    productIds?: string[];
    categoryIds?: string[];
    orderAmount?: number;
    userId?: string;
    businessOwnerId?: string;
  }): Promise<Discount[]> {
    const now = Timestamp.now();
    const { productIds = [], categoryIds = [], orderAmount, userId, businessOwnerId } = options;

    // Get all active discounts
    // Note: Firestore date queries can be tricky, so we'll get all active discounts first
    // and filter by date in memory
    const allDiscounts = await this.findAll({
      filters: [
        { field: 'status', operator: '==', value: 'active' }
      ]
    });

    console.log('[DiscountRepository] All active discounts found:', allDiscounts.length);
    if (allDiscounts.length > 0) {
      console.log('[DiscountRepository] Sample discount data:', {
        id: allDiscounts[0].id,
        name: allDiscounts[0].name,
        scope: allDiscounts[0].scope,
        startDate: allDiscounts[0].startDate,
        startDateType: typeof allDiscounts[0].startDate,
        startDateIsDate: allDiscounts[0].startDate instanceof Date,
        startDateIsTimestamp: allDiscounts[0].startDate instanceof Timestamp,
        endDate: allDiscounts[0].endDate,
        endDateType: typeof allDiscounts[0].endDate,
        endDateIsDate: allDiscounts[0].endDate instanceof Date,
        endDateIsTimestamp: allDiscounts[0].endDate instanceof Timestamp,
        minOrderAmount: allDiscounts[0].minOrderAmount,
        status: allDiscounts[0].status
      });
    }

    const filtered = allDiscounts.filter(discount => {
      // Check date validity - handle various date formats
      // Dates may have been converted to Date objects by convertTimestamps
      let startDate: Timestamp | null = null;
      let endDate: Timestamp | null = null;
      
      console.log('[DiscountRepository] Processing discount:', discount.id, discount.name, 'scope:', discount.scope);

      try {
        // Handle Timestamp object
        if (discount.startDate instanceof Timestamp) {
          startDate = discount.startDate;
        }
        // Handle Date object (converted by convertTimestamps)
        else if (discount.startDate instanceof Date) {
          startDate = Timestamp.fromDate(discount.startDate);
        }
        // Handle Firestore Timestamp format with _seconds or seconds
        else if (discount.startDate && typeof discount.startDate === 'object') {
          const seconds = (discount.startDate as any)._seconds || (discount.startDate as any).seconds;
          const nanoseconds = (discount.startDate as any)._nanoseconds || (discount.startDate as any).nanoseconds || 0;
          if (typeof seconds === 'number') {
            startDate = new Timestamp(seconds, nanoseconds);
          }
        }
        // Handle ISO string
        else if (typeof discount.startDate === 'string') {
          startDate = Timestamp.fromDate(new Date(discount.startDate));
        }
      } catch (error) {
        console.error('Error parsing startDate for discount:', discount.id, discount.startDate, error);
      }

      try {
        // Handle Timestamp object
        if (discount.endDate instanceof Timestamp) {
          endDate = discount.endDate;
        }
        // Handle Date object (converted by convertTimestamps)
        else if (discount.endDate instanceof Date) {
          endDate = Timestamp.fromDate(discount.endDate);
        }
        // Handle Firestore Timestamp format with _seconds or seconds
        else if (discount.endDate && typeof discount.endDate === 'object') {
          const seconds = (discount.endDate as any)._seconds || (discount.endDate as any).seconds;
          const nanoseconds = (discount.endDate as any)._nanoseconds || (discount.endDate as any).nanoseconds || 0;
          if (typeof seconds === 'number') {
            endDate = new Timestamp(seconds, nanoseconds);
          }
        }
        // Handle ISO string
        else if (typeof discount.endDate === 'string') {
          endDate = Timestamp.fromDate(new Date(discount.endDate));
        }
      } catch (error) {
        console.error('Error parsing endDate for discount:', discount.id, discount.endDate, error);
      }

      // If we couldn't parse dates, skip this discount
      if (!startDate || !endDate) {
        console.log('[DiscountRepository] Could not parse dates for discount:', discount.id, discount.name, 'startDate:', discount.startDate, 'startDate type:', typeof discount.startDate, 'endDate:', discount.endDate, 'endDate type:', typeof discount.endDate);
        return false;
      }

      // Check if discount is currently valid or upcoming
      // For available discounts, we want to show:
      // - Discounts that have started (startDate <= now) AND haven't ended (endDate >= now)
      // - OR upcoming discounts that will start soon (within next 30 days)
      const startValid = startDate <= now;
      const endValid = endDate >= now;
      const isUpcoming = startDate > now && startDate <= Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
      
      if (!startValid && !isUpcoming) {
        // Discount hasn't started and isn't upcoming
        console.log('[DiscountRepository] Discount not started yet:', discount.id, discount.name, 
          'start:', startDate.toDate().toISOString(), 
          'now:', now.toDate().toISOString());
        return false;
      }
      
      if (!endValid && startValid) {
        // Discount has ended
        console.log('[DiscountRepository] Discount has ended:', discount.id, discount.name, 
          'end:', endDate.toDate().toISOString(), 
          'now:', now.toDate().toISOString());
        return false;
      }
      // Check if discount is applicable based on scope
      if (discount.scope === 'order') {
        // Order-level discounts apply to all orders
      } else if (discount.scope === 'shipping') {
        // Shipping-level discounts apply to all orders (they discount shipping cost)
        // No product/category matching needed
      } else if (discount.scope === 'product') {
        // Check if any product matches
        if (!discount.targetIds || discount.targetIds.length === 0) {
          console.log('[DiscountRepository] Product discount filtered - no targetIds:', discount.id, discount.name);
          return false;
        }
        const hasMatchingProduct = productIds.some(id => discount.targetIds?.includes(id));
        if (!hasMatchingProduct) {
          console.log('[DiscountRepository] Product discount filtered - no matching products:', discount.id, discount.name, 
            'targetIds:', discount.targetIds, 
            'productIds:', productIds);
          return false;
        }
        console.log('[DiscountRepository] ✓ Product discount passed product matching:', discount.id, discount.name);
      } else if (discount.scope === 'category') {
        // Check if any category matches
        if (!discount.targetIds || discount.targetIds.length === 0) {
          console.log('[DiscountRepository] Category discount filtered - no targetIds:', discount.id, discount.name);
          return false;
        }
        const hasMatchingCategory = categoryIds.some(id => discount.targetIds?.includes(id));
        if (!hasMatchingCategory) {
          console.log('[DiscountRepository] Category discount filtered - no matching categories:', discount.id, discount.name, 
            'targetIds:', discount.targetIds, 
            'categoryIds:', categoryIds);
          return false;
        }
        console.log('[DiscountRepository] ✓ Category discount passed category matching:', discount.id, discount.name);
      }

      // Check minimum order amount
      // Only check if orderAmount is provided and discount has a minimum requirement
      if (discount.minOrderAmount) {
        // If orderAmount is not provided or is 0, skip the minimum check (allow the discount)
        // This allows discounts to show even when cart is empty
        if (orderAmount !== undefined && orderAmount > 0 && orderAmount < discount.minOrderAmount) {
          console.log('Discount filtered by minOrderAmount:', discount.id, 'min:', discount.minOrderAmount, 'orderAmount:', orderAmount);
          return false;
        }
      }

      // Check user restrictions
      if (discount.applicableUserIds && discount.applicableUserIds.length > 0 && userId) {
        if (!discount.applicableUserIds.includes(userId)) {
          console.log('Discount filtered by user restriction:', discount.id);
          return false;
        }
      }

      // Check business owner restrictions (for shop owner discounts)
      // Only filter if businessOwnerId is provided in options
      // Platform-wide discounts (no businessOwnerId) should be available to all
      if (discount.businessOwnerId && businessOwnerId) {
        if (discount.businessOwnerId !== businessOwnerId) {
          console.log('Discount filtered by businessOwnerId:', discount.id);
          return false;
        }
      }

      // Check usage limit
      if (discount.usageLimit) {
        if ((discount.usedCount || 0) >= discount.usageLimit) {
          console.log('Discount filtered by usage limit:', discount.id, 'used:', discount.usedCount, 'limit:', discount.usageLimit);
          return false;
        }
      }

      console.log('[DiscountRepository] ✓ Discount passed all filters:', discount.id, discount.name, discount.scope);
      return true;
    });
    
    console.log('[DiscountRepository] Final filtered count:', filtered.length, 'out of', allDiscounts.length, 'total discounts');
    return filtered;
  }

  /**
   * Find discounts by business owner
   */
  async findByBusinessOwnerId(businessOwnerId: string): Promise<Discount[]> {
    return this.findAll({
      filters: [
        { field: 'businessOwnerId', operator: '==', value: businessOwnerId }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Find discounts created by a user
   */
  async findByCreatedBy(userId: string): Promise<Discount[]> {
    return this.findAll({
      filters: [
        { field: 'createdBy', operator: '==', value: userId }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Increment usage count for a discount
   */
  async incrementUsage(discountId: string): Promise<void> {
    const discount = await this.findById(discountId);
    if (discount) {
      await this.update(discountId, {
        usedCount: (discount.usedCount || 0) + 1
      } as Partial<Discount>);
    }
  }

  /**
   * Update discount status based on dates
   */
  async updateExpiredStatuses(): Promise<void> {
    const now = Timestamp.now();
    const activeDiscounts = await this.findAll({
      filters: [
        { field: 'status', operator: '==', value: 'active' }
      ]
    });

    for (const discount of activeDiscounts) {
      const endDate = discount.endDate instanceof Timestamp 
        ? discount.endDate 
        : Timestamp.fromDate(new Date(discount.endDate));
      
      if (endDate < now) {
        await this.update(discount.id, {
          status: 'expired' as DiscountStatus
        } as Partial<Discount>);
      }
    }
  }
}

