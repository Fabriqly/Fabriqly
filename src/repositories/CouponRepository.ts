import { BaseRepository } from './BaseRepository';
import { CouponCode } from '@/types/promotion';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export class CouponRepository extends BaseRepository<CouponCode> {
  constructor() {
    super(Collections.COUPONS);
  }

  /**
   * Find coupon by code (case-insensitive)
   */
  async findByCode(code: string): Promise<CouponCode | null> {
    const coupons = await this.findAll({
      filters: [
        { field: 'code', operator: '==', value: code.toUpperCase() }
      ]
    });

    return coupons.length > 0 ? coupons[0] : null;
  }

  /**
   * Find coupons by discount ID
   */
  async findByDiscountId(discountId: string): Promise<CouponCode[]> {
    return this.findAll({
      filters: [
        { field: 'discountId', operator: '==', value: discountId }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(
    code: string,
    options: {
      userId?: string;
      orderAmount?: number;
    }
  ): Promise<{ isValid: boolean; coupon: CouponCode | null; error?: string }> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return {
        isValid: false,
        coupon: null,
        error: 'Coupon code not found'
      };
    }

    // Check status
    if (coupon.status !== 'active') {
      return {
        isValid: false,
        coupon,
        error: 'Coupon code is not active'
      };
    }

    // Check expiration dates
    const now = Timestamp.now();
    if (coupon.startDate) {
      const startDate = coupon.startDate instanceof Timestamp
        ? coupon.startDate
        : Timestamp.fromDate(new Date(coupon.startDate));
      if (startDate > now) {
        return {
          isValid: false,
          coupon,
          error: 'Coupon code is not yet valid'
        };
      }
    }

    if (coupon.endDate) {
      const endDate = coupon.endDate instanceof Timestamp
        ? coupon.endDate
        : Timestamp.fromDate(new Date(coupon.endDate));
      if (endDate < now) {
        return {
          isValid: false,
          coupon,
          error: 'Coupon code has expired'
        };
      }
    }

    // Check total usage limit
    if (coupon.usageLimit) {
      if ((coupon.usedCount || 0) >= coupon.usageLimit) {
        return {
          isValid: false,
          coupon,
          error: 'Coupon code has reached its usage limit'
        };
      }
    }

    // Check per-user usage limit
    if (coupon.perUserLimit && options.userId) {
      // Note: This would require tracking per-user usage in a separate collection
      // For now, we'll check if user is in the applicable list
      if (coupon.applicableUserIds && coupon.applicableUserIds.length > 0) {
        if (!coupon.applicableUserIds.includes(options.userId)) {
          return {
            isValid: false,
            coupon,
            error: 'Coupon code is not applicable to this user'
          };
        }
      }
    }

    return {
      isValid: true,
      coupon
    };
  }

  /**
   * Increment usage count for a coupon
   */
  async incrementUsage(couponId: string, userId?: string): Promise<void> {
    const coupon = await this.findById(couponId);
    if (coupon) {
      await this.update(couponId, {
        usedCount: (coupon.usedCount || 0) + 1
      } as Partial<CouponCode>);
    }
  }

  /**
   * Check if coupon code already exists
   */
  async codeExists(code: string): Promise<boolean> {
    const coupon = await this.findByCode(code);
    return coupon !== null;
  }

  /**
   * Update coupon status based on dates
   */
  async updateExpiredStatuses(): Promise<void> {
    const now = Timestamp.now();
    const activeCoupons = await this.findAll({
      filters: [
        { field: 'status', operator: '==', value: 'active' }
      ]
    });

    for (const coupon of activeCoupons) {
      if (coupon.endDate) {
        const endDate = coupon.endDate instanceof Timestamp
          ? coupon.endDate
          : Timestamp.fromDate(new Date(coupon.endDate));
        
        if (endDate < now) {
          await this.update(coupon.id, {
            status: 'expired' as const
          } as Partial<CouponCode>);
        }
      }
    }
  }
}



