import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/services/MessagingService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const messagingService = new MessagingService();

/**
 * GET /api/messages/conversation/[conversationId] - Get messages in a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await messagingService.getConversationMessages(
      conversationId,
      session.user.id,
      limit
    );

    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    
    const status = error.message === 'Conversation not found' ? 404 : 
                   error.message.includes('not a participant') ? 403 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch messages' 
      },
      { status }
    );
  }
}

/**
 * PATCH /api/messages/conversation/[conversationId] - Mark conversation as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    
    await messagingService.markConversationAsRead(conversationId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error: any) {
    console.error('Error marking conversation as read:', error);
    
    const status = error.message === 'Conversation not found' ? 404 : 
                   error.message.includes('not a participant') ? 403 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to mark conversation as read' 
      },
      { status }
    );
  }
}

