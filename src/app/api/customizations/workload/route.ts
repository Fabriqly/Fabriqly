import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { AppError } from '@/errors/AppError';

const customizationService = new CustomizationService();

/**
 * GET /api/customizations/workload - Get designer workload information
 * For load balancing and dashboard display
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.unauthorized()),
        { status: 401 }
      );
    }

    // Only admins and designers can view workload
    if (!['designer', 'business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        ResponseBuilder.error(AppError.forbidden()),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const designerId = searchParams.get('designerId');

    if (designerId) {
      // Get specific designer's workload
      if (session.user.role !== 'admin' && designerId !== session.user.id) {
        return NextResponse.json(
          ResponseBuilder.error(AppError.forbidden()),
          { status: 403 }
        );
      }
      
      const workload = await customizationService.getDesignerWorkload(designerId);
      return NextResponse.json(
        ResponseBuilder.success(workload),
        { status: 200 }
      );
    } else {
      // Get all designers' workload (admin only)
      if (session.user.role !== 'admin') {
        const workload = await customizationService.getDesignerWorkload(session.user.id);
        return NextResponse.json(
          ResponseBuilder.success([workload]),
          { status: 200 }
        );
      }
      
      const workloads = await customizationService.getAllDesignersWorkload();
      return NextResponse.json(
        ResponseBuilder.success(workloads),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching workload:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

