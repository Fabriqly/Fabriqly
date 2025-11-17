import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/services/MessagingService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const messagingService = new MessagingService();

/**
 * GET /api/messages/unread-count - Get unread message count for user
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

    const unreadCount = await messagingService.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        count: unreadCount
      }
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch unread count' 
      },
      { status: 500 }
    );
  }
}












