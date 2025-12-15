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

    // Check if user exists in Firebase Auth with the NextAuth session UID
    try {
      const userByUid = await adminAuth.getUser(session.user.id);
      firebaseUid = userByUid.uid;
      console.log('✅ User exists in Firebase Auth with matching UID:', firebaseUid);
    } catch (error: any) {
      // User doesn't exist with this UID, check by email
      if (error.code === 'auth/user-not-found') {
        if (session.user.email) {
          try {
            const userByEmail = await adminAuth.getUserByEmail(session.user.email);
            // If user exists by email but UID doesn't match, delete and recreate with correct UID
            if (userByEmail.uid !== session.user.id) {
              console.warn('⚠️ UID mismatch detected, fixing by recreating user:', {
                firebaseUid: userByEmail.uid,
                sessionUid: session.user.id,
                email: session.user.email
              });
              
              try {
                // Delete the existing user with wrong UID
                await adminAuth.deleteUser(userByEmail.uid);
                console.log('✅ Deleted user with mismatched UID');
                
                // Create new user with correct NextAuth session UID
                const userRecord = await adminAuth.createUser({
                  uid: session.user.id,
                  email: session.user.email || '',
                  displayName: session.user.name || undefined,
                  photoURL: session.user.image || undefined,
                  emailVerified: true
                });
                firebaseUid = userRecord.uid;
                console.log('✅ Created user with correct UID:', firebaseUid);
              } catch (deleteError: any) {
                console.error('❌ Failed to fix UID mismatch:', deleteError);
                // Fallback: use existing UID (client will use API fallback)
                firebaseUid = userByEmail.uid;
                console.warn('⚠️ Using existing Firebase Auth UID due to fix failure:', firebaseUid);
              }
            } else {
              firebaseUid = userByEmail.uid;
            }
          } catch (emailError: any) {
            // User doesn't exist by email either, create new user with NextAuth UID
            if (emailError.code === 'auth/user-not-found') {
              try {
                const userRecord = await FirebaseAdminService.createUserInFirebaseAuth({
                  uid: session.user.id,
                  email: session.user.email || '',
                  displayName: session.user.name || undefined,
                  photoURL: session.user.image || undefined,
                  emailVerified: true
                });
                firebaseUid = userRecord.uid;
                console.log('✅ Created new user in Firebase Auth:', firebaseUid);
              } catch (createError: any) {
                console.error('❌ Failed to create user in Firebase Auth:', createError);
                return NextResponse.json(
                  { 
                    success: false,
                    error: 'Failed to create user in Firebase Auth',
                    details: createError.message
                  },
                  { status: 500 }
                );
              }
            } else {
              throw emailError;
            }
          }
        } else {
          // No email, try to create with UID only
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
            return NextResponse.json(
              { 
                success: false,
                error: 'User not found in Firebase Auth and cannot be created' 
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

