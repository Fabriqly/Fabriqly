import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationFilters, NotificationPagination, CreateNotificationData } from '@/types/notification';

const notificationService = new NotificationService();

/**
 * GET /api/notifications - Get user's notifications with filters and pagination
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

    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: NotificationFilters = {};
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as any;
    }
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category') as any;
    }
    if (searchParams.get('isRead') !== null) {
      filters.isRead = searchParams.get('isRead') === 'true';
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority') as any;
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }

    // Parse pagination
    const pagination: NotificationPagination = {};
    if (searchParams.get('limit')) {
      pagination.limit = parseInt(searchParams.get('limit')!);
    }
    if (searchParams.get('offset')) {
      pagination.offset = parseInt(searchParams.get('offset')!);
    }
    if (searchParams.get('lastId')) {
      pagination.lastId = searchParams.get('lastId')!;
    }

    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      Object.keys(filters).length > 0 ? filters : undefined,
      Object.keys(pagination).length > 0 ? pagination : undefined
    );

    return NextResponse.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch notifications' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create notification (admin/system only)
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

    // Only admin or system can create notifications directly
    // Regular users should use event handlers
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create notifications directly' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const notificationData: CreateNotificationData = {
      userId: body.userId,
      type: body.type,
      category: body.category,
      priority: body.priority,
      title: body.title,
      message: body.message,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      metadata: body.metadata,
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType
    };

    // Validate required fields
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      );
    }

    // For system announcements, allow bypassing preferences if explicitly requested
    const bypassPreferences = body.bypassPreferences === true && notificationData.type === 'system_announcement';

    try {
      const notification = await notificationService.createNotification(notificationData, bypassPreferences);

      return NextResponse.json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error: any) {
      // Check if error is due to preferences
      if (error.message?.includes('preferences')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Notification creation disabled by user preferences. Set bypassPreferences: true to override.',
            details: error.message
          },
          { status: 403 }
        );
      }
      throw error; // Re-throw other errors
    }
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create notification',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


