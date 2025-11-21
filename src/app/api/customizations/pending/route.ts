import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationService } from '@/services/CustomizationService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

const customizationService = new CustomizationService();

/**
 * GET /api/customizations/pending - Get pending customization requests
 * Available for designers to claim
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

    // Only designers, business owners, and admins can view pending requests
    if (!['designer', 'business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Forbidden', statusCode: 403 }),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const requests = await customizationService.getPendingRequests(limit);

    return NextResponse.json(
      ResponseBuilder.success(requests),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

