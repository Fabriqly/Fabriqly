import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CouponService } from '@/services/CouponService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { CreateCouponData } from '@/types/promotion';

const couponService = new CouponService();

/**
 * GET /api/coupons
 * List coupons (admin/shop owner only)
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

    // Only admins and shop owners can list coupons
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
      return NextResponse.json(
        ResponseBuilder.error('Insufficient permissions'),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const discountId = searchParams.get('discountId');

    if (discountId) {
      const coupons = await couponService.getCouponsByDiscountId(discountId);
      return NextResponse.json(
        ResponseBuilder.success(coupons)
      );
    }

    // Return all coupons
    const coupons = await couponService.getAllCoupons();
    return NextResponse.json(
      ResponseBuilder.success(coupons)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to fetch coupons'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons
 * Create a new coupon code
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    // Only admins and shop owners can create coupons
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
      return NextResponse.json(
        ResponseBuilder.error('Insufficient permissions'),
        { status: 403 }
      );
    }

    const body: CreateCouponData = await request.json();
    
    if (!body.code || !body.discountId) {
      return NextResponse.json(
        ResponseBuilder.error('Missing required fields: code, discountId'),
        { status: 400 }
      );
    }

    // Check if code already exists
    const exists = await couponService.codeExists(body.code);
    if (exists) {
      return NextResponse.json(
        ResponseBuilder.error('Coupon code already exists'),
        { status: 400 }
      );
    }

    const coupon = await couponService.createCoupon(body);

    return NextResponse.json(
      ResponseBuilder.success(coupon),
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to create coupon'),
      { status: 500 }
    );
  }
}



