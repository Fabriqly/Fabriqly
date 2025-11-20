import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/services/MessagingService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const messagingService = new MessagingService();

/**
 * GET /api/messages - Get user's conversations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversations = await messagingService.getUserConversations(session.user.id);

    return NextResponse.json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch conversations' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages - Send a message
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, content, type, attachments, customizationRequestId, orderId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message content or attachments are required' },
        { status: 400 }
      );
    }

    const message = await messagingService.sendMessage({
      senderId: session.user.id,
      receiverId,
      content,
      type: type || 'text',
      attachments,
      customizationRequestId,
      orderId
    });

    return NextResponse.json({
      success: true,
      data: message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send message' 
      },
      { status: 500 }
    );
  }
}
















