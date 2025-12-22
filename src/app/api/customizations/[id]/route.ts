import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { AppError } from '@/errors/AppError';
import { Timestamp } from 'firebase-admin/firestore';

const customizationService = new CustomizationService();

// Helper function to serialize Firestore Timestamps to ISO strings
const serializeTimestamps = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(serializeTimestamps);
  }
  
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeTimestamps(value);
    }
    return serialized;
  }
  
  return data;
};

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/customizations/[id] - Get single customization request
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.unauthorized()),
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestData = await customizationService.getRequestWithDetails(id);

    if (!requestData) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.notFound('Request not found')),
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = requestData.customerId === session.user.id;
    const isAssignedDesigner = requestData.designerId === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isDesignerViewingPending = 
      (session.user.role === 'designer' || session.user.role === 'business_owner') && 
      requestData.status === 'pending_designer_review';
    
    // Allow shop owner (business owner who owns the printing shop) to view
    let isShopOwner = false;
    if (requestData.printingShopId && session.user.role === 'business_owner') {
      try {
        const { FirebaseAdminService } = await import('@/services/firebase-admin');
        const { Collections } = await import('@/services/firebase');
        const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, requestData.printingShopId);
        isShopOwner = shop?.userId === session.user.id;
      } catch (error) {
        console.error('Error checking shop owner:', error);
      }
    }

    if (!isOwner && !isAssignedDesigner && !isAdmin && !isDesignerViewingPending && !isShopOwner) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.forbidden()),
        { status: 403 }
      );
    }

    // Serialize Timestamps to ISO strings for client-side consumption
    const serializedData = serializeTimestamps(requestData);

    return NextResponse.json(
      ResponseBuilder.success(serializedData),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching customization request:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

/**
 * PATCH /api/customizations/[id] - Update customization request
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.unauthorized()),
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing request
    const existingRequest = await customizationService.getRequestById(id);
    if (!existingRequest) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.notFound('Request not found')),
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = existingRequest.customerId === session.user.id;
    const isAssignedDesigner = existingRequest.designerId === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const isDesignerAssigning = 
      (session.user.role === 'designer' || session.user.role === 'business_owner') && 
      body.action === 'assign' &&
      existingRequest.status === 'pending_designer_review';

    if (!isOwner && !isAssignedDesigner && !isAdmin && !isDesignerAssigning) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.forbidden()),
        { status: 403 }
      );
    }

    // Handle specific actions
    if (body.action === 'assign' && (session.user.role === 'designer' || session.user.role === 'business_owner' || session.user.role === 'admin')) {
      const updated = await customizationService.assignDesigner(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated),
        { status: 200 }
      );
    }

    if (body.action === 'uploadFinal' && isAssignedDesigner) {
      if (!body.designerFinalFile || !body.designerPreviewImage) {
        return NextResponse.json(
          ResponseBuilder.error(AppError.badRequest('Missing required files')),
          { status: 400 }
        );
      }
      const updated = await customizationService.uploadFinalDesign(
        id,
        session.user.id,
        body.designerFinalFile,
        body.designerPreviewImage,
        body.designerNotes,
        body.recommendedBrand,
        body.recommendedPrintingType
      );
      return NextResponse.json(
        ResponseBuilder.success(updated),
        { status: 200 }
      );
    }

    if (body.action === 'approve' && isOwner) {
      const updated = await customizationService.approveDesign(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated),
        { status: 200 }
      );
    }

    if (body.action === 'reject' && isOwner) {
      if (!body.rejectionReason) {
        return NextResponse.json(
          ResponseBuilder.error(AppError.badRequest('Rejection reason is required')),
          { status: 400 }
        );
      }
      const updated = await customizationService.rejectDesign(id, session.user.id, body.rejectionReason);
      return NextResponse.json(
        ResponseBuilder.success(updated),
        { status: 200 }
      );
    }

    if (body.action === 'cancel') {
      const updated = await customizationService.cancelRequest(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated),
        { status: 200 }
      );
    }

    return NextResponse.json(
      ResponseBuilder.error(AppError.badRequest('Invalid action')),
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating customization request:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

/**
 * DELETE /api/customizations/[id] - Cancel/Delete customization request
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.unauthorized()),
        { status: 401 }
      );
    }

    const { id } = await params;
    const updated = await customizationService.cancelRequest(id, session.user.id);

    return NextResponse.json(
      ResponseBuilder.success(updated),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling customization request:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

