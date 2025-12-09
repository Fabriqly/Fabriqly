import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRepository } from '@/repositories/UserRepository';
import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/services/firebase';

/**
 * GET /api/test/notifications/check-user - Check user preferences for notifications (admin only)
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

    // If email is provided instead of userId, find user by email
    if (email && !userId) {
      const userRepo = new UserRepository();
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

    // Get user data directly from Firestore to ensure we get the raw data
    const userDocRef = adminDb.collection(Collections.USERS).doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        data: { userId }
      });
    }

    const rawUserData = userDoc.data();
    
    // Also get via repository for comparison
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);

    // Access preferences from raw Firestore data
    const rawPreferences = rawUserData?.profile?.preferences?.notifications;
    const rawPushValue = rawPreferences?.push;
    
    // Also try from repository data
    const repoPreferences = user?.profile?.preferences?.notifications;
    const repoPushValue = repoPreferences?.push;
    
    // Use raw Firestore data as source of truth
    const preferences = rawPreferences || repoPreferences;
    const pushValue = rawPushValue !== undefined ? rawPushValue : (repoPushValue !== undefined ? repoPushValue : undefined);
    const pushEnabled = pushValue !== false; // Default to true if not set (undefined or true)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        preferences: {
          exists: !!preferences,
          push: pushValue, // Raw value from Firestore
          pushEnabled, // Calculated value (true if push !== false)
          email: preferences?.email,
          sms: preferences?.sms,
          rawPreferences: preferences // Include raw object for debugging
        },
        profileExists: !!user.profile,
        preferencesPath: user.profile?.preferences ? 'user.profile.preferences.notifications' : 'not set',
        debug: {
          hasProfile: !!rawUserData?.profile,
          hasPreferences: !!rawUserData?.profile?.preferences,
          hasNotifications: !!rawUserData?.profile?.preferences?.notifications,
          profileKeys: rawUserData?.profile ? Object.keys(rawUserData.profile) : [],
          preferencesKeys: rawUserData?.profile?.preferences ? Object.keys(rawUserData.profile.preferences) : [],
          rawPushValue: rawPushValue,
          repoPushValue: repoPushValue,
          rawPreferences: rawPreferences,
          repoPreferences: repoPreferences
        }
      }
    });
  } catch (error: any) {
    console.error('Error checking user preferences:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check user preferences' 
      },
      { status: 500 }
    );
  }
}

