import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const notificationService = new NotificationService();

/**
 * POST /api/notifications/read-all - Mark all notifications as read
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

    await notificationService.markAllAsRead(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to mark all notifications as read' 
      },
      { status: 500 }
    );
  }
}


