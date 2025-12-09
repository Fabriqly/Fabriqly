import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRepository } from '@/repositories/UserRepository';

/**
 * GET /api/users/preferences - Get user preferences
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

    const userRepo = new UserRepository();
    const user = await userRepo.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const preferences = user.profile?.preferences || {
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      theme: 'light'
    };

    return NextResponse.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch preferences' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/preferences - Update user preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notifications, theme } = body;

    // Validate preferences structure
    if (notifications && typeof notifications !== 'object') {
      return NextResponse.json(
        { error: 'Invalid notifications preferences' },
        { status: 400 }
      );
    }

    if (theme && !['light', 'dark'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update preferences
    const currentPreferences = user.profile?.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...(notifications && {
        notifications: {
          ...currentPreferences.notifications,
          ...notifications
        }
      }),
      ...(theme && { theme })
    };

    // Update user document
    await userRepo.update(session.user.id, {
      'profile.preferences': updatedPreferences
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences
    });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update preferences' 
      },
      { status: 500 }
    );
  }
}

