// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-errors';
import { authLogger } from '@/lib/auth-logging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, role } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['customer', 'designer', 'business_owner'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Log registration attempt
    authLogger.log({
      level: 'INFO' as any,
      message: `Registration attempt for ${email}`,
      action: 'REGISTER_ATTEMPT' as any,
      details: { email, role }
    });

    // Create user in Firebase Auth
    const user = await FirebaseAdminService.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      role
    });

    // Log successful registration
    authLogger.log({
      level: 'INFO' as any,
      message: `User registered successfully: ${email}`,
      action: 'REGISTER_SUCCESS' as any,
      userId: user.uid,
      details: { email, role }
    });

    // Log activity
    try {
      console.log('Logging user registration activity...');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'user_registered',
        title: 'User Registration',
        description: `New user registered: ${email}`,
        priority: 'medium',
        status: 'active',
        actorId: user.uid,
        targetId: user.uid,
        targetType: 'user',
        targetName: `${firstName} ${lastName}`,
        metadata: {
          email: email,
          role: role,
          displayName: `${firstName} ${lastName}`,
          registrationMethod: 'email',
          registeredAt: new Date().toISOString()
        }
      });
      console.log('✅ User registration activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging user registration activity:', activityError);
      // Don't fail the registration if activity logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. Please sign in.',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    }, { status: 201 });

  } catch (error: any) {
    const authError = AuthErrorHandler.handleError(error);
    
    // Log registration failure
    authLogger.log({
      level: 'ERROR' as any,
      message: `Registration failed: ${error.message}`,
      action: 'REGISTER_FAILURE' as any,
      errorCode: authError.code,
      details: { error: error.message }
    });

    return NextResponse.json(
      { error: authError.userMessage },
      { status: 500 }
    );
  }
}
