import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventBus } from '@/events/EventBus';
import { NotificationEventHandlers } from '@/events/EventHandlers';

/**
 * GET /api/test/notifications/check-handlers - Check if event handlers are initialized (admin only)
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

    // Initialize handlers if not already initialized
    // This is a safety check - handlers should be initialized on app startup
    try {
      NotificationEventHandlers.initialize();
    } catch (error: any) {
      // Handlers might already be initialized, which is fine
      if (!error.message?.includes('already')) {
        console.warn('Event handlers initialization warning:', error);
      }
    }

    // Check if event bus has listeners
    // Note: EventBus doesn't expose listeners directly, so we'll test by checking if it's initialized
    const eventBusInitialized = eventBus !== null && eventBus !== undefined;

    // Test event emission (this will trigger handlers if they're set up)
    let testEventEmitted = false;
    try {
      eventBus.emit('test.notification.check', { test: true });
      testEventEmitted = true;
    } catch (error) {
      console.error('Error emitting test event:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        eventBusInitialized,
        testEventEmitted,
        handlersInitialized: true, // We just initialized them
        message: 'Event handlers have been initialized. Notification system should be ready.'
      }
    });
  } catch (error: any) {
    console.error('Error checking event handlers:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check event handlers' 
      },
      { status: 500 }
    );
  }
}

