import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { escrowService } from '@/services/EscrowService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

/**
 * POST /api/admin/payouts/release-designer
 * Manually release designer payout for a customization request
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Forbidden - Admin access required', statusCode: 403 }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Request ID is required', statusCode: 400 }),
        { status: 400 }
      );
    }

    console.log(`[AdminPayout] Admin ${session.user.id} releasing designer payment for request: ${requestId}`);

    // Release the designer payment
    await escrowService.releaseDesignerPayment(requestId);

    console.log(`[AdminPayout] Designer payment released successfully for request: ${requestId}`);

    return NextResponse.json(
      ResponseBuilder.success(
        { requestId, message: 'Designer payout released successfully' },
        'Payout processed successfully'
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error('[AdminPayout] Error releasing designer payment:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

