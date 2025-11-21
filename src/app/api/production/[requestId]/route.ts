import { NextRequest, NextResponse } from 'next/server';
import { ProductionService } from '@/services/ProductionService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const productionService = new ProductionService();

/**
 * POST /api/production/[requestId] - Confirm production
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const body = await request.json();
    const { estimatedCompletionDate, materials, notes } = body;

    if (!estimatedCompletionDate) {
      return NextResponse.json(
        { error: 'Estimated completion date is required' },
        { status: 400 }
      );
    }

    const updatedRequest = await productionService.confirmProduction(
      requestId,
      session.user.id,
      {
        estimatedCompletionDate: new Date(estimatedCompletionDate),
        materials,
        notes
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Production confirmed successfully'
    });
  } catch (error: any) {
    console.error('Error confirming production:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('forbidden') || error.message.includes('do not own') ? 403 :
                   error.message.includes('No printing shop') || error.message.includes('must be approved') || error.message.includes('payment') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to confirm production' 
      },
      { status }
    );
  }
}

/**
 * PATCH /api/production/[requestId] - Update production status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = await params;
    const body = await request.json();
    const { action, status, estimatedCompletionDate, materials, notes, qualityCheckPassed, qualityCheckNotes } = body;

    if (action === 'start') {
      // Start production
      const updatedRequest = await productionService.startProduction(
        requestId,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: updatedRequest,
        message: 'Production started successfully'
      });
    } else if (action === 'complete') {
      // Complete production
      if (qualityCheckPassed === undefined) {
        return NextResponse.json(
          { error: 'Quality check status is required' },
          { status: 400 }
        );
      }

      const updatedRequest = await productionService.completeProduction(
        requestId,
        session.user.id,
        qualityCheckPassed,
        qualityCheckNotes
      );

      return NextResponse.json({
        success: true,
        data: updatedRequest,
        message: 'Production completed successfully'
      });
    } else {
      // Update production details
      const updatedRequest = await productionService.updateProduction(
        requestId,
        session.user.id,
        {
          status,
          estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : undefined,
          materials,
          notes,
          qualityCheckPassed,
          qualityCheckNotes
        }
      );

      return NextResponse.json({
        success: true,
        data: updatedRequest,
        message: 'Production updated successfully'
      });
    }
  } catch (error: any) {
    console.error('Error updating production:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('forbidden') || error.message.includes('do not own') ? 403 :
                   error.message.includes('not been started') || error.message.includes('must be confirmed') || error.message.includes('Quality check') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update production' 
      },
      { status }
    );
  }
}

