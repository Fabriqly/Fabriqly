import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';
import { NotificationType } from '@/types/notification';

const notificationService = new NotificationService();

/**
 * POST /api/test/notifications - Create test notifications (admin only)
 * 
 * Body options:
 * - type: NotificationType (optional, default: 'system_announcement')
 * - count: number (optional, default: 1)
 * - allTypes: boolean (optional, create one of each type)
 * - userId: string (optional, default: current user)
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

    // Only admin can create test notifications
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetUserId = body.userId || session.user.id;
    const type = body.type || 'system_announcement';
    const count = body.count || 1;
    const allTypes = body.allTypes === true;

    const notificationTypes: NotificationType[] = [
      'order_created',
      'order_status_changed',
      'order_cancelled',
      'order_payment_received',
      'order_payment_failed',
      'customization_request_created',
      'customization_designer_assigned',
      'customization_design_completed',
      'customization_design_approved',
      'customization_design_rejected',
      'customization_pricing_created',
      'customization_payment_required',
      'customization_request_cancelled',
      'message_received',
      'review_received',
      'review_reply_received',
      'product_published',
      'product_updated',
      'user_welcome',
      'user_verified',
      'application_status_updated',
      'profile_updated',
      'system_announcement'
    ];

    const createdNotifications = [];

    // For testing, bypass user preferences check by directly creating notifications
    // This allows testing even if user has notifications disabled
    const bypassPreferences = body.bypassPreferences !== false; // Default to true for testing

    if (allTypes) {
      // Create one notification of each type
      for (const notificationType of notificationTypes) {
        try {
          let notification;
          if (bypassPreferences) {
            // Bypass preferences check by using createNotification directly with NotificationTemplates
            const { NotificationTemplates } = await import('@/services/NotificationTemplates');
            const notificationData = NotificationTemplates.generate(
              notificationType,
              targetUserId,
              {
                test: true,
                testType: notificationType,
                relatedEntityId: `test-${Date.now()}-${notificationType}`,
                relatedEntityType: 'test'
              }
            );
            notification = await (notificationService as any).createNotification(notificationData, true);
          } else {
            notification = await notificationService.sendNotification(
              targetUserId,
              notificationType,
              {
                test: true,
                testType: notificationType,
                relatedEntityId: `test-${Date.now()}-${notificationType}`,
                relatedEntityType: 'test'
              }
            );
          }
          createdNotifications.push({
            type: notificationType,
            id: notification.id,
            title: notification.title
          });
        } catch (error: any) {
          console.error(`Failed to create ${notificationType}:`, error);
          createdNotifications.push({
            type: notificationType,
            error: error.message,
            details: error.stack
          });
        }
      }
    } else {
      // Create specified number of notifications of specified type
      for (let i = 0; i < count; i++) {
        try {
          let notification;
          if (bypassPreferences) {
            // Bypass preferences check
            const { NotificationTemplates } = await import('@/services/NotificationTemplates');
            const notificationData = NotificationTemplates.generate(
              type as NotificationType,
              targetUserId,
              {
                test: true,
                testNumber: i + 1,
                relatedEntityId: `test-${Date.now()}-${i}`,
                relatedEntityType: 'test'
              }
            );
            notification = await (notificationService as any).createNotification(notificationData, true);
          } else {
            notification = await notificationService.sendNotification(
              targetUserId,
              type as NotificationType,
              {
                test: true,
                testNumber: i + 1,
                relatedEntityId: `test-${Date.now()}-${i}`,
                relatedEntityType: 'test'
              }
            );
          }
          createdNotifications.push({
            type,
            id: notification.id,
            title: notification.title
          });
        } catch (error: any) {
          console.error(`Failed to create notification ${i + 1}:`, error);
          createdNotifications.push({
            type,
            error: error.message,
            details: error.stack
          });
        }
      }
    }

    const successCount = createdNotifications.filter(n => !n.error).length;
    const errorCount = createdNotifications.filter(n => n.error).length;

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} notification(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      data: {
        created: successCount,
        failed: errorCount,
        total: createdNotifications.length,
        notifications: createdNotifications,
        userId: targetUserId
      }
    });
  } catch (error: any) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create test notifications' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/notifications - Get test notification info (admin only)
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const unreadCount = await notificationService.getUnreadCount(session.user.id);
    const recentNotifications = await notificationService.getRecentNotifications(session.user.id, 5);

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
        recentNotifications: recentNotifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          isRead: n.isRead,
          createdAt: n.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('Error getting test notification info:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get notification info' 
      },
      { status: 500 }
    );
  }
}

