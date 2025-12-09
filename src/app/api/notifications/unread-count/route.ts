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

    const count = await notificationService.getUnreadCount(session.user.id);

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


