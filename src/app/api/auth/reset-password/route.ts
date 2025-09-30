import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/services/firebase';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { AuthErrorHandler } from '@/lib/auth-errors';
import { authLogger } from '@/lib/auth-logging';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Processing password reset

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
        },
        { status: 400 }
      );
    }

    // Get and validate token
    const tokenDocRef = doc(db, Collections.PASSWORD_RESET_TOKENS, token);
    const tokenDoc = await getDoc(tokenDocRef);

    if (!tokenDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data();

    // Check if token is already used
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();

    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const email = tokenData.email;

    // Get user from Firebase Auth
    let userRecord;
    try {
      userRecord = await FirebaseAdminService.getUserByEmail(email);
      if (!userRecord) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('❌ Error finding user:', error);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password in Firebase Auth
    try {
      await FirebaseAdminService.updateUserPassword(userRecord.uid, password);
      // Password updated in Firebase Auth
    } catch (error: any) {
      console.error('❌ Error updating password in Firebase Auth:', error);
      const authError = AuthErrorHandler.handleError(error);
      return NextResponse.json(
        { success: false, error: authError.userMessage },
        { status: 500 }
      );
    }

    // Mark token as used
    try {
      await updateDoc(tokenDocRef, {
        used: true,
        usedAt: new Date()
      });
      // Token marked as used
    } catch (error) {
      console.error('❌ Error marking token as used:', error);
      // Don't fail the request if this fails
    }

    // Update user's updatedAt timestamp in Firestore
    try {
      const userDocRef = doc(db, Collections.USERS, userRecord.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          updatedAt: new Date().toISOString(),
          lastPasswordChange: new Date().toISOString()
        });
        // User document updated in Firestore
      }
    } catch (error) {
      console.error('❌ Error updating user document:', error);
      // Don't fail the request if this fails
    }

    // Log the password reset activity
    try {
      authLogger.log({
        level: 'INFO' as any,
        message: `Password reset successful for ${email}`,
        action: 'PASSWORD_RESET_SUCCESS' as any,
        userId: userRecord.uid,
        details: { email, method: 'custom' }
      });
    } catch (error) {
      console.error('❌ Error logging password reset:', error);
      // Don't fail the request if logging fails
    }

    // Password reset completed successfully

    return NextResponse.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    // Log the error
    try {
      authLogger.log({
        level: 'ERROR' as any,
        message: `Password reset failed: ${error.message}`,
        action: 'PASSWORD_RESET_FAILURE' as any,
        details: { error: error.message }
      });
    } catch (logError) {
      console.error('❌ Error logging password reset failure:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
