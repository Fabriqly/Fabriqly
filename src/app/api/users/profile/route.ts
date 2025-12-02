import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

    const userData = await FirebaseAdminService.getDocument(Collections.USERS, session.user.id);

    if (!userData) {
      console.error('❌ User not found:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive data
    const { password, ...profileData } = userData;
    
    // Ensure profile object exists with at least empty firstName and lastName
    if (!profileData.profile) {
      profileData.profile = {
        firstName: '',
        lastName: ''
      };
    } else {
      // Ensure firstName and lastName exist (even if empty)
      profileData.profile = {
        firstName: profileData.profile.firstName || '',
        lastName: profileData.profile.lastName || '',
        ...profileData.profile
      };
    }
    
    console.log('✅ Profile fetched successfully:', {
      userId: session.user.id,
      hasProfile: !!profileData.profile,
      firstName: profileData.profile.firstName,
      lastName: profileData.profile.lastName,
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
      hasAddress: !!body.address
    });
    
    const {
      displayName,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      photoURL
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }
    
    // Auto-generate displayName from firstName and lastName if not provided
    const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();

    const currentData = await FirebaseAdminService.getDocument(Collections.USERS, session.user.id);

    if (!currentData) {
      console.error('❌ User not found in Firestore:', session.user.id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log('📄 Current user data:', {
      hasProfile: !!currentData.profile,
      currentDisplayName: currentData.displayName
    });

    // Prepare update data with proper structure
    const updateData: any = {
      displayName: finalDisplayName,
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
        } : (currentData.profile?.address || {})
      },
      updatedAt: new Date().toISOString()
    };

    // Update photoURL if provided
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }

    console.log('💾 Updating Firestore with data:', {
      displayName: updateData.displayName,
      profileKeys: Object.keys(updateData.profile),
      hasAddress: !!updateData.profile.address
    });

    // Update in Firestore using Admin SDK
    await FirebaseAdminService.updateDocument(Collections.USERS, session.user.id, updateData);
    
    console.log('✅ Firestore update successful');

    // Verify the update
    const verifiedData = await FirebaseAdminService.getDocument(Collections.USERS, session.user.id);
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
