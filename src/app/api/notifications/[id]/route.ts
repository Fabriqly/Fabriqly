import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const notificationService = new NotificationService();

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/notifications/[id] - Get single notification
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notification = await notificationService.getNotification(params.id, session.user.id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch notification' 
      },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id] - Mark notification as read/unread
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isRead } = body;

    if (isRead === true) {
      // Mark as read
      const notification = await notificationService.markAsRead(params.id, session.user.id);
      return NextResponse.json({
        success: true,
        data: notification
      });
    } else if (isRead === false) {
      // Mark as unread (update to set isRead to false)
      const notification = await notificationService.getNotification(params.id, session.user.id);
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      
      // Update to unread
      const updated = await notificationService['notificationRepo'].update(params.id, {
        isRead: false,
        readAt: undefined,
        updatedAt: new Date()
      } as any);

      return NextResponse.json({
        success: true,
        data: updated
      });
    } else {
      return NextResponse.json(
        { error: 'isRead field is required (true or false)' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update notification' 
      },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id] - Delete notification
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await notificationService.deleteNotification(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete notification' 
      },
      { status: error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 404 : 500 }
    );
  }
}


