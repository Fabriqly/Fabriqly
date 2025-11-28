import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DiscountService } from '@/services/DiscountService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { UpdateDiscountData } from '@/types/promotion';
import { Timestamp } from 'firebase-admin/firestore';

const discountService = new DiscountService();

// Helper function to convert Firestore Timestamps and Date objects to ISO strings
const convertTimestamps = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle Date objects (already converted from Timestamps by FirebaseAdminService)
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Firestore Timestamp objects (if not already converted)
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  
  // Handle Firestore Timestamp format with _seconds and _nanoseconds (underscore prefix)
  if (data && typeof data === 'object' && typeof data._seconds === 'number') {
    const seconds = data._seconds || 0;
    const nanoseconds = data._nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
  }
  
  // Handle Firestore Timestamp format with seconds and nanoseconds (no underscore)
  if (data && typeof data === 'object' && typeof data.seconds === 'number') {
    const seconds = data.seconds || 0;
    const nanoseconds = data.nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  return data;
};

/**
 * GET /api/discounts/[id]
 * Get a single discount by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    const { id } = await params;
    const discount = await discountService.getDiscountById(id);

    if (!discount) {
      return NextResponse.json(
        ResponseBuilder.error('Discount not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role !== 'admin') {
      if (session.user.role === 'business_owner') {
        // Shop owners can only see their own discounts
        if (discount.createdBy !== session.user.id && discount.businessOwnerId) {
          // Additional check: verify business owner ID matches
          return NextResponse.json(
            ResponseBuilder.error('Insufficient permissions'),
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          ResponseBuilder.error('Insufficient permissions'),
          { status: 403 }
        );
      }
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const convertedDiscount = convertTimestamps(discount);

    return NextResponse.json(
      ResponseBuilder.success(convertedDiscount)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to fetch discount'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/discounts/[id]
 * Update a discount
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    // Only admins and shop owners can update discounts
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
      return NextResponse.json(
        ResponseBuilder.error('Insufficient permissions'),
        { status: 403 }
      );
    }

    const { id } = await params;
    const discount = await discountService.getDiscountById(id);
    
    if (!discount) {
      return NextResponse.json(
        ResponseBuilder.error('Discount not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'business_owner') {
      if (discount.createdBy !== session.user.id) {
        return NextResponse.json(
          ResponseBuilder.error('Insufficient permissions'),
          { status: 403 }
        );
      }
    }

    const body: UpdateDiscountData = await request.json();
    const updatedDiscount = await discountService.updateDiscount(id, body);

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const convertedDiscount = convertTimestamps(updatedDiscount);

    return NextResponse.json(
      ResponseBuilder.success(convertedDiscount)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to update discount'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/discounts/[id]
 * Delete a discount
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    // Only admins and shop owners can delete discounts
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
      return NextResponse.json(
        ResponseBuilder.error('Insufficient permissions'),
        { status: 403 }
      );
    }

    const { id } = await params;
    const discount = await discountService.getDiscountById(id);
    
    if (!discount) {
      return NextResponse.json(
        ResponseBuilder.error('Discount not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === 'business_owner') {
      if (discount.createdBy !== session.user.id) {
        return NextResponse.json(
          ResponseBuilder.error('Insufficient permissions'),
          { status: 403 }
        );
      }
    }

    await discountService.deleteDiscount(id);

    return NextResponse.json(
      ResponseBuilder.success({ id })
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to delete discount'),
      { status: 500 }
    );
  }
}

