import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/services/ReviewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const reviewService = new ReviewService();

/**
 * POST /api/customizations/[id]/complete - Mark transaction as completed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await reviewService.completeCustomizationTransaction(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Transaction completed successfully. You can now leave reviews.'
    });
  } catch (error: any) {
    console.error('Error completing transaction:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Unauthorized') ? 403 :
                   error.message.includes('must be ready') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to complete transaction' 
      },
      { status }
    );
  }
}

