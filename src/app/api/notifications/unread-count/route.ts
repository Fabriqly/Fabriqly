import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const notificationService = new NotificationService();

/**
 * GET /api/notifications/unread-count - Get unread notification count
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

    // Exclude message notifications; messages are handled by the header MessageBell.
    const allUnread = await notificationService.getUserNotifications(session.user.id, { isRead: false }, { limit: 500 });
    const count = (allUnread || []).filter(n => n.type !== 'message_received').length;

    return NextResponse.json({
      success: true,
      data: { count }
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
