import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';
import { UserRepository } from '@/repositories/UserRepository';
import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/services/firebase';

/**
 * GET /api/test/notifications/debug - Debug notification creation (admin only)
 * Query params: userId (optional, defaults to current user)
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

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId') || session.user.id;
    const email = searchParams.get('email');

    const userRepo = new UserRepository();
    const notificationService = new NotificationService();

    // If email is provided instead of userId, find user by email
    if (email && !userId) {
      const userByEmail = await userRepo.findByEmail(email);
      if (userByEmail) {
        userId = userByEmail.id;
      } else {
        return NextResponse.json({
          success: false,
          error: 'User not found with that email',
          data: { email }
        });
      }
    }

    // Get user
    const user = await userRepo.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        data: { userId }
      });
    }

    // Check preferences
    const preferences = user.profile?.preferences?.notifications;
    const pushEnabled = preferences?.push !== false;

    // Try to create a test notification
    let testResult = null;
    try {
      const testNotification = await notificationService.sendNotification(
        userId,
        'system_announcement',
        {
          test: true,
          debug: true,
          title: 'Debug Test',
          message: 'This is a debug test notification',
          relatedEntityId: `debug-${Date.now()}`,
          relatedEntityType: 'test'
        }
      );
      testResult = {
        success: true,
        notificationId: testNotification.id,
        title: testNotification.title
      };
    } catch (error: any) {
      testResult = {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }

    // Get recent notifications
    const recentNotifications = await notificationService.getRecentNotifications(userId, 5);
    const unreadCount = await notificationService.getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        preferences: {
          exists: !!preferences,
          push: preferences?.push,
          pushEnabled,
          email: preferences?.email,
          sms: preferences?.sms,
          path: user.profile?.preferences ? 'user.profile.preferences.notifications' : 'not set'
        },
        testResult,
        notifications: {
          unreadCount,
          recent: recentNotifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            isRead: n.isRead,
            createdAt: n.createdAt
          }))
        }
      }
    });
  } catch (error: any) {
    console.error('Error debugging notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to debug notifications' 
      },
      { status: 500 }
    );
  }
}

