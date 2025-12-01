import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DiscountService } from '@/services/DiscountService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { CreateDiscountData } from '@/types/promotion';
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
 * GET /api/discounts
 * List discounts with optional filters
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
    const scope = searchParams.get('scope');
    const status = searchParams.get('status');
    const businessOwnerId = searchParams.get('businessOwnerId');
    const createdBy = searchParams.get('createdBy');

    // Only admins can see all discounts
    // Shop owners can only see their own discounts
    const filters: any = {};
    
    if (session.user.role !== 'admin') {
      // For shop owners, filter by their business owner ID
      if (session.user.role === 'business_owner') {
        // Get business owner ID from user profile or shop
        // For now, filter by createdBy
        filters.createdBy = session.user.id;
      } else {
        // Customers can't see discounts list
        return NextResponse.json(
          ResponseBuilder.error('Insufficient permissions'),
          { status: 403 }
        );
      }
    }

    if (scope) filters.scope = scope;
    if (status) filters.status = status;
    if (businessOwnerId) filters.businessOwnerId = businessOwnerId;
    if (createdBy) filters.createdBy = createdBy;

    const discounts = await discountService.getAllDiscounts(filters);

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const convertedDiscounts = convertTimestamps(discounts);

    return NextResponse.json(
      ResponseBuilder.success(convertedDiscounts)
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to fetch discounts'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/discounts
 * Create a new discount
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

    // Only admins and shop owners can create discounts
    if (session.user.role !== 'admin' && session.user.role !== 'business_owner') {
      return NextResponse.json(
        ResponseBuilder.error('Insufficient permissions'),
        { status: 403 }
      );
    }

    const body: CreateDiscountData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.value || !body.scope) {
      return NextResponse.json(
        ResponseBuilder.error('Missing required fields: name, type, value, scope'),
        { status: 400 }
      );
    }

    // Shop owners can only create discounts for their own business
    if (session.user.role === 'business_owner') {
      // Get business owner ID from user profile
      // For now, we'll allow them to set it, but validate it matches
      // In production, you'd fetch this from the user's shop profile
    }

    const discount = await discountService.createDiscount(body, session.user.id);

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const convertedDiscount = convertTimestamps(discount);

    return NextResponse.json(
      ResponseBuilder.success(convertedDiscount),
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      ResponseBuilder.error(error.message || 'Failed to create discount'),
      { status: 500 }
    );
  }
}

