import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/services/MessagingService';
import { CustomizationService } from '@/services/CustomizationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const messagingService = new MessagingService();
const customizationService = new CustomizationService();

/**
 * GET /api/messages/customization/[requestId] - Get or create conversation for customization request
 */
export async function GET(
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
    
    // Get customization request
    const customizationRequest = await customizationService.getRequestById(requestId);
    
    if (!customizationRequest) {
      return NextResponse.json(
        { error: 'Customization request not found' },
        { status: 404 }
      );
    }

    // Verify user is customer or designer
    if (
      customizationRequest.customerId !== session.user.id &&
      customizationRequest.designerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'You are not authorized to view this conversation' },
        { status: 403 }
      );
    }

    // Check if designer is assigned
    if (!customizationRequest.designerId) {
      return NextResponse.json(
        { error: 'No designer assigned yet' },
        { status: 400 }
      );
    }

    // Get or create conversation
    const conversation = await messagingService.getCustomizationConversation(
      requestId,
      customizationRequest.customerId,
      customizationRequest.designerId
    );

    // Get messages
    const messages = await messagingService.getConversationMessages(
      conversation.id,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
        customizationRequest: {
          id: customizationRequest.id,
          status: customizationRequest.status,
          productName: customizationRequest.productName,
          customerId: customizationRequest.customerId,
          designerId: customizationRequest.designerId
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching customization conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch conversation' 
      },
      { status: 500 }
    );
  }
}

