import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { AppError } from '@/errors/AppError';

const customizationService = new CustomizationService();

/**
 * GET /api/customizations/stats - Get customization statistics
 * Query params:
 * - customerId: filter by customer
 * - designerId: filter by designer
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

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const designerId = searchParams.get('designerId');

    // Authorization
    let filters: any = {};
    
    if (session.user.role === 'customer') {
      filters.customerId = session.user.id;
    } else if (session.user.role === 'designer' || session.user.role === 'business_owner') {
      if (customerId) {
        // Designers can't see other customers' stats
        return NextResponse.json(
          ResponseBuilder.error(AppError.forbidden()),
          { status: 403 }
        );
      }
      filters.designerId = session.user.id;
    } else if (session.user.role === 'admin') {
      if (customerId) filters.customerId = customerId;
      if (designerId) filters.designerId = designerId;
    }

    const stats = await customizationService.getStatistics(filters);

    return NextResponse.json(
      ResponseBuilder.success(stats),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching customization stats:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

