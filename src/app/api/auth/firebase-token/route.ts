import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * GET /api/auth/firebase-token
 * Get a Firebase custom token for the current user
 * This allows client-side Firestore queries to work with security rules
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

    let firebaseUid = session.user.id;

    // Check if user exists in Firebase Auth
    try {
      await adminAuth.getUser(session.user.id);
    } catch (error: any) {
      // User doesn't exist in Firebase Auth, create them (for OAuth users)
      if (error.code === 'auth/user-not-found') {
        try {
          const userRecord = await FirebaseAdminService.createUserInFirebaseAuth({
            uid: session.user.id,
            email: session.user.email || '',
            displayName: session.user.name || undefined,
            photoURL: session.user.image || undefined,
            emailVerified: true
          });
          firebaseUid = userRecord.uid;
        } catch (createError: any) {
          // If creation fails, try to get by email
          try {
            if (session.user.email) {
              const userByEmail = await adminAuth.getUserByEmail(session.user.email);
              firebaseUid = userByEmail.uid;
            }
          } catch (emailError) {
            return NextResponse.json(
              { 
                success: false,
                error: 'User not found in Firebase Auth' 
              },
              { status: 404 }
            );
          }
        }
      } else {
        throw error;
      }
    }

    // Create custom token for the user
    const customToken = await FirebaseAdminService.createCustomToken(
      firebaseUid,
      {
        email: session.user.email,
        role: session.user.role
      }
    );

    return NextResponse.json({
      success: true,
      token: customToken
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create Firebase token' 
      },
      { status: 500 }
    );
  }
}

