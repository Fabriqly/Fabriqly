import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/services/NotificationService';
import { UserRepository } from '@/repositories/UserRepository';

const notificationService = new NotificationService();
const userRepo = new UserRepository();

/**
 * POST /api/admin/system-announcements - Send system announcement to users (admin only)
 * 
 * Body:
 * - title: string (required)
 * - message: string (required)
 * - priority: 'low' | 'medium' | 'high' | 'urgent' (optional, default: 'medium')
 * - actionUrl: string (optional)
 * - actionLabel: string (optional)
 * - recipientType: 'all' | 'specific' (required)
 * - userIds: string[] (required if recipientType is 'specific')
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, priority = 'medium', actionUrl, actionLabel, recipientType, userIds } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!recipientType || !['all', 'specific'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'recipientType must be "all" or "specific"' },
        { status: 400 }
      );
    }

    if (recipientType === 'specific' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      return NextResponse.json(
        { error: 'userIds array is required when recipientType is "specific"' },
        { status: 400 }
      );
    }

    // Get target user IDs
    let targetUserIds: string[] = [];

    if (recipientType === 'all') {
      // Get all users
      const allUsers = await userRepo.findAll();
      targetUserIds = allUsers.map(user => user.id);
    } else {
      // Resolve user IDs from provided IDs or emails
      const resolvedIds: string[] = [];
      
      for (const identifier of userIds) {
        if (!identifier || typeof identifier !== 'string') continue;
        
        // Check if it's an email
        if (identifier.includes('@')) {
          const user = await userRepo.findByEmail(identifier);
          if (user) {
            resolvedIds.push(user.id);
          } else {
            console.warn(`User not found with email: ${identifier}`);
          }
        } else {
          // Assume it's a user ID
          const user = await userRepo.findById(identifier);
          if (user) {
            resolvedIds.push(user.id);
          } else {
            console.warn(`User not found with ID: ${identifier}`);
          }
        }
      }
      
      targetUserIds = resolvedIds;
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid users found to send announcement to' },
        { status: 400 }
      );
    }

    // Create notifications for all target users
    const notifications = [];
    let sentCount = 0;
    let skippedCount = 0;

    for (const userId of targetUserIds) {
      try {
        const notification = await notificationService.sendNotification(
          userId,
          'system_announcement',
          {
            title,
            message,
            priority,
            actionUrl,
            actionLabel,
            relatedEntityId: `announcement-${Date.now()}`,
            relatedEntityType: 'system_announcement',
            metadata: {
              sentBy: session.user.id,
              sentAt: new Date().toISOString(),
              recipientType
            }
          }
        );
        notifications.push(notification);
        sentCount++;
      } catch (error: any) {
        // If notification creation fails (e.g., user has preferences disabled), skip
        console.warn(`Failed to send notification to user ${userId}:`, error.message);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${sentCount} user(s)${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      data: {
        sentCount,
        skippedCount,
        totalUsers: targetUserIds.length,
        notifications: notifications.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title
        }))
      }
    });
  } catch (error: any) {
    console.error('Error sending system announcement:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send system announcement' 
      },
      { status: 500 }
    );
  }
}

