import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

const customizationService = new CustomizationService();

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
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestData = await customizationService.getRequestWithDetails(id);

    if (!requestData) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Request not found', statusCode: 404 }),
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

    if (!isOwner && !isAssignedDesigner && !isAdmin && !isDesignerViewingPending) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Forbidden', statusCode: 403 }),
        { status: 403 }
      );
    }

    return NextResponse.json(
      ResponseBuilder.success(requestData),
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
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing request
    const existingRequest = await customizationService.getRequestById(id);
    if (!existingRequest) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Request not found', statusCode: 404 }),
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
        ResponseBuilder.error({ message: 'Forbidden', statusCode: 403 }),
        { status: 403 }
      );
    }

    // Handle specific actions
    if (body.action === 'assign' && (session.user.role === 'designer' || session.user.role === 'business_owner' || session.user.role === 'admin')) {
      const updated = await customizationService.assignDesigner(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated, 'Request assigned successfully'),
        { status: 200 }
      );
    }

    if (body.action === 'uploadFinal' && isAssignedDesigner) {
      if (!body.designerFinalFile || !body.designerPreviewImage) {
        return NextResponse.json(
          ResponseBuilder.error({ message: 'Missing required files', statusCode: 400 }),
          { status: 400 }
        );
      }
      const updated = await customizationService.uploadFinalDesign(
        id,
        session.user.id,
        body.designerFinalFile,
        body.designerPreviewImage,
        body.designerNotes
      );
      return NextResponse.json(
        ResponseBuilder.success(updated, 'Final design uploaded successfully'),
        { status: 200 }
      );
    }

    if (body.action === 'approve' && isOwner) {
      const updated = await customizationService.approveDesign(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated, 'Design approved successfully'),
        { status: 200 }
      );
    }

    if (body.action === 'reject' && isOwner) {
      if (!body.rejectionReason) {
        return NextResponse.json(
          ResponseBuilder.error({ message: 'Rejection reason is required', statusCode: 400 }),
          { status: 400 }
        );
      }
      const updated = await customizationService.rejectDesign(id, session.user.id, body.rejectionReason);
      return NextResponse.json(
        ResponseBuilder.success(updated, 'Design rejected. Designer will revise.'),
        { status: 200 }
      );
    }

    if (body.action === 'cancel') {
      const updated = await customizationService.cancelRequest(id, session.user.id);
      return NextResponse.json(
        ResponseBuilder.success(updated, 'Request cancelled'),
        { status: 200 }
      );
    }

    return NextResponse.json(
      ResponseBuilder.error({ message: 'Invalid action', statusCode: 400 }),
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
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    const { id } = await params;
    const updated = await customizationService.cancelRequest(id, session.user.id);

    return NextResponse.json(
      ResponseBuilder.success(updated, 'Request cancelled'),
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

