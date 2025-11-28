import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CouponService } from '@/services/CouponService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { CouponValidationRequest } from '@/types/promotion';

const couponService = new CouponService();

/**
 * POST /api/coupons/validate
 * Validate a coupon code
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

    const body: CouponValidationRequest = await request.json();
    
    if (!body.code) {
      return NextResponse.json(
        ResponseBuilder.error('Coupon code is required'),
        { status: 400 }
      );
    }

    const validation = await couponService.validateCoupon({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(
      ResponseBuilder.success(validation)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to validate coupon'),
      { status: 500 }
    );
  }
}



