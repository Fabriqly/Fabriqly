import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/services/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { ActivityService } from '@/services/ActivityService';
import { ServiceContainer } from '@/container/ServiceContainer';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('📥 GET /api/users/profile - Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.error('❌ Unauthorized: No session or user ID');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userDocRef = doc(db, Collections.USERS, session.user.id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('❌ User not found:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Remove sensitive data
    const { password, ...profileData } = userData;
    
    console.log('✅ Profile fetched successfully:', {
      userId: session.user.id,
      hasProfile: !!profileData.profile,
      displayName: profileData.displayName
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.user.id,
        ...profileData
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('📝 PUT /api/users/profile - Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.error('❌ Unauthorized: No session or user ID');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📦 Request body:', {
      displayName: body.displayName,
      firstName: body.firstName,
      lastName: body.lastName,
      hasAddress: !!body.address,
      hasPreferences: !!body.preferences
    });
    
    const {
      displayName,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      preferences
    } = body;

    // Validate required fields
    if (!displayName || !firstName || !lastName) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Display name, first name, and last name are required' },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, Collections.USERS, session.user.id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error('❌ User not found in Firestore:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentData = userDoc.data();
    console.log('📄 Current user data:', {
      hasProfile: !!currentData.profile,
      currentDisplayName: currentData.displayName
    });

    // Prepare update data with proper structure
    const updateData = {
      displayName,
      profile: {
        ...currentData.profile,
        firstName,
        lastName,
        phone: phone || '',
        dateOfBirth: dateOfBirth || null,
        address: address ? {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country || ''
        } : (currentData.profile?.address || {}),
        preferences: preferences ? {
          notifications: {
            email: preferences.notifications?.email ?? true,
            sms: preferences.notifications?.sms ?? false,
            push: preferences.notifications?.push ?? true
          },
          theme: preferences.theme || 'light'
        } : (currentData.profile?.preferences || {
          notifications: { email: true, sms: false, push: true },
          theme: 'light'
        })
      },
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Updating Firestore with data:', {
      displayName: updateData.displayName,
      profileKeys: Object.keys(updateData.profile),
      hasAddress: !!updateData.profile.address,
      hasPreferences: !!updateData.profile.preferences
    });

    // Update in Firestore
    await updateDoc(userDocRef, updateData);
    
    console.log('✅ Firestore update successful');

    // Verify the update
    const updatedDoc = await getDoc(userDocRef);
    const verifiedData = updatedDoc.data();
    console.log('🔍 Verified update:', {
      displayName: verifiedData?.displayName,
      firstName: verifiedData?.profile?.firstName,
      lastName: verifiedData?.profile?.lastName
    });

    // Log activity
    try {
      const activityService = ServiceContainer.getInstance().get<ActivityService>('activityService');
      await activityService.logActivity(
        'profile_updated',
        session.user.id,
        session.user.id,
        {
          updatedFields: Object.keys(body),
          timestamp: new Date().toISOString()
        }
      );
      console.log('✅ Activity logged successfully');
    } catch (activityError) {
      console.error('⚠️ Failed to log profile update activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    // Return the complete updated user data
    const responseData = {
      id: session.user.id,
      ...verifiedData
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
