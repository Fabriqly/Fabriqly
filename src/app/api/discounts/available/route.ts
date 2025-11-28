import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DiscountService } from '@/services/DiscountService';
import { CouponService } from '@/services/CouponService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';

const discountService = new DiscountService();
const couponService = new CouponService();

/**
 * GET /api/discounts/available
 * Get available discounts and coupons for the current user/cart
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderAmount = parseFloat(searchParams.get('orderAmount') || '0');
    const productIds = searchParams.getAll('productIds[]');
    const categoryIds = searchParams.getAll('categoryIds[]');
    const userId = session.user.id;

    // Get all applicable discounts
    // For shipping and order scopes, we don't need productIds/categoryIds
    // Pass empty arrays if no products, but still fetch discounts
    // Pass 0 for orderAmount if not provided to allow discounts without minOrderAmount
    console.log('[Available Discounts API] Fetching discounts with params:', {
      productIds: productIds.length > 0 ? productIds : [],
      categoryIds: categoryIds.length > 0 ? categoryIds : [],
      orderAmount: orderAmount > 0 ? orderAmount : 0,
      userId
    });
    
    // Get applicable discounts (for display)
    const applicableDiscounts = await discountService.getApplicableDiscounts({
      productIds: productIds.length > 0 ? productIds : [],
      categoryIds: categoryIds.length > 0 ? categoryIds : [],
      orderAmount: orderAmount > 0 ? orderAmount : 0,
      userId
    });

    console.log('[Available Discounts API] Applicable discounts:', applicableDiscounts.length);
    
    // Also get all active discounts to fetch their coupons
    // This ensures we show all valid coupons even if their parent discount doesn't pass all filters
    const allActiveDiscounts = await discountService.getAllDiscounts({
      status: 'active'
    });

    console.log('[Available Discounts API] All active discounts:', allActiveDiscounts.length);
    
    // Create a set of applicable discount IDs for quick lookup
    const applicableDiscountIds = new Set(applicableDiscounts.map(d => d.id));

    // Get coupons for all active discounts (not just applicable ones)
    // This way we can show coupons even if the discount itself doesn't pass all filters
    const discountsWithCoupons = await Promise.all(
      allActiveDiscounts.map(async (discount) => {
        // Get coupons for this discount
        let coupons: any[] = [];
        try {
          const allCoupons = await couponService.getCouponsByDiscountId(discount.id);
          // Filter to only include valid, usable coupons
          const validCoupons = await couponService.filterValidCoupons(allCoupons, userId);
          coupons = validCoupons;
          
          console.log('[Available Discounts API] Discount:', discount.id, discount.name, 
            '- Total coupons:', allCoupons.length, 
            '- Valid coupons:', validCoupons.length);
        } catch (error) {
          // If method doesn't exist or fails, continue without coupons
          console.error('Error fetching coupons:', error);
        }
        
        // Check if this discount is applicable
        const isApplicable = applicableDiscountIds.has(discount.id);
        
        return {
          discount,
          coupons: coupons.map((coupon: any) => ({
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            perUserLimit: coupon.perUserLimit,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            status: coupon.status
          })),
          isApplicable // Flag to indicate if discount passes all filters
        };
      })
    );

    // Filter to only show discounts that either:
    // 1. Are applicable (pass all filters), OR
    // 2. Have valid coupons (even if discount doesn't pass all filters)
    const discountsToShow = discountsWithCoupons.filter(({ discount, coupons, isApplicable }) => {
      return isApplicable || coupons.length > 0;
    });

    // Format response with eligibility info
    const availableDiscounts = discountsToShow.map(({ discount, coupons, isApplicable }) => {
      // Calculate potential discount amount for preview
      let previewDiscountAmount = 0;
      if (discount.scope === 'shipping') {
        // For shipping, we'd need shipping cost - but we'll calculate it as percentage/fixed of a sample shipping cost
        const sampleShipping = 9.99; // Default shipping cost
        previewDiscountAmount = discount.type === 'percentage'
          ? (sampleShipping * discount.value) / 100
          : Math.min(discount.value, sampleShipping);
      } else {
        // For product/category/order, use order amount
        previewDiscountAmount = discount.type === 'percentage'
          ? (orderAmount * discount.value) / 100
          : Math.min(discount.value, orderAmount);
        
        if (discount.maxDiscountAmount) {
          previewDiscountAmount = Math.min(previewDiscountAmount, discount.maxDiscountAmount);
        }
      }

      return {
        discount: {
          id: discount.id,
          name: discount.name,
          description: discount.description,
          type: discount.type,
          value: discount.value,
          scope: discount.scope,
          targetIds: discount.targetIds,
          minOrderAmount: discount.minOrderAmount,
          maxDiscountAmount: discount.maxDiscountAmount,
          startDate: discount.startDate,
          endDate: discount.endDate,
          status: discount.status
        },
        coupons,
        previewDiscountAmount: Math.max(0, previewDiscountAmount),
        requiresCoupon: coupons.length > 0,
        isApplicable // Include flag to show if discount is fully applicable
      };
    });

    return NextResponse.json(
      ResponseBuilder.success(availableDiscounts)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to fetch available discounts'),
      { status: 500 }
    );
  }
}

