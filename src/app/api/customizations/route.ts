import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { CreateCustomizationRequest, CustomizationFilters } from '@/types/customization';

const customizationService = new CustomizationService();

/**
 * GET /api/customizations - Get customization requests
 * Query params:
 * - customerId: filter by customer
 * - designerId: filter by designer
 * - status: filter by status
 * - productId: filter by product
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const designerId = searchParams.get('designerId');
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');

    // Authorization: users can only see their own requests unless they're admin/designer
    let filters: CustomizationFilters = {};

    if (session.user.role === 'customer') {
      filters.customerId = session.user.id;
    } else if (session.user.role === 'designer') {
      // Designers can see requests assigned to them or pending ones
      if (designerId && designerId !== session.user.id) {
        return NextResponse.json(
          ResponseBuilder.error({ message: 'Forbidden', statusCode: 403 }),
          { status: 403 }
        );
      }
      filters.designerId = session.user.id;
    } else if (session.user.role === 'business_owner') {
      // Business owners can see their designer requests
      filters.designerId = session.user.id;
    } else if (session.user.role === 'admin') {
      // Admins can filter freely
      if (customerId) filters.customerId = customerId;
      if (designerId) filters.designerId = designerId;
    }

    if (status) filters.status = status as any;
    if (productId) filters.productId = productId;

    const requests = await customizationService.searchRequests(filters);

    return NextResponse.json(
      ResponseBuilder.success(requests),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching customization requests:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

/**
 * POST /api/customizations - Create new customization request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.productId || !body.productName || !body.customizationNotes) {
      return NextResponse.json(
        ResponseBuilder.error({ 
          message: 'Missing required fields: productId, productName, customizationNotes', 
          statusCode: 400 
        }),
        { status: 400 }
      );
    }

    const requestData: CreateCustomizationRequest = {
      customerId: session.user.id,
      customerName: session.user.name || session.user.email,
      customerEmail: session.user.email,
      productId: body.productId,
      productName: body.productName,
      productImage: body.productImage,
      customizationNotes: body.customizationNotes,
      customerDesignFile: body.customerDesignFile,
      customerPreviewImage: body.customerPreviewImage
    };

    const customizationRequest = await customizationService.createRequest(requestData);

    return NextResponse.json(
      ResponseBuilder.success(customizationRequest, 'Customization request created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customization request:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

