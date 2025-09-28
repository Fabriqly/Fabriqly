// SIMPLE PASSWORD RESET - Works with Instagram-style tokens and updates Firebase Auth
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Collections } from '@/services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    console.log('🔐 SIMPLE PASSWORD RESET');
    console.log('🔑 Token:', token?.substring(0, 16) + '...');

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    try {
      // 🔍 Find and validate the reset token
      console.log('🔍 Looking up reset token...');
      const tokensRef = collection(db, Collections.PASSWORD_RESET_TOKENS);
      const tokenQuery = query(tokensRef, where('token', '==', token));
      const tokenSnapshot = await getDocs(tokenQuery);

      if (tokenSnapshot.empty) {
        console.log('❌ Token not found');
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      const tokenDoc = tokenSnapshot.docs[0];
      const tokenData = tokenDoc.data();

      // Check expiry and usage
      const now = new Date();
      const expiresAt = tokenData.expiresAt.toDate();
      
      if (now > expiresAt) {
        console.log('❌ Token expired');
        await deleteDoc(tokenDoc.ref);
        return NextResponse.json(
          { error: 'Reset token has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (tokenData.used) {
        console.log('❌ Token already used');
        return NextResponse.json(
          { error: 'Reset token has already been used. Please request a new one.' },
          { status: 400 }
        );
      }

      console.log('✅ Token is valid for user:', tokenData.email);

      // 🔐 FORCE Firebase Auth Update: Send Firebase password reset email
      console.log('📧 Forcing Firebase Auth update by sending Firebase reset email...');
      try {
        await sendPasswordResetEmail(auth, tokenData.email);
        console.log('✅ Firebase password reset email sent - this will update Firebase Auth');
        
        // Mark token as used
        await updateDoc(tokenDoc.ref, {
          used: true,
          usedAt: new Date(),
          method: 'firebase_auth_email'
        });

        return NextResponse.json({
          success: true,
          message: 'To complete your password reset, please check your email for a Firebase password reset link. This will ensure your password is properly updated in the authentication system.',
          email: tokenData.email,
          method: 'firebase_auth_required',
          nextSteps: [
            '1. Check your email inbox (and spam folder)',
            '2. Look for a NEW email from Firebase (different from Fabriqly email)',
            '3. Click "Reset Password" in the Firebase email',
            '4. Set your new password on the Firebase page',
            '5. Return to login - your old password will no longer work'
          ],
          important: 'You must complete the Firebase password reset to ensure your password is properly updated!'
        });
        
      } catch (firebaseError: any) {
        console.error('❌ Firebase password reset email failed:', firebaseError);
        console.error('   This means we cannot update Firebase Auth properly');
        
        return NextResponse.json({
          success: false,
          error: 'Unable to update password in authentication system',
          message: 'Password reset failed. Please try again or contact support.',
          details: firebaseError.message,
          troubleshooting: 'The authentication system could not be updated. Please request a new password reset.'
        }, { status: 500 });
      }

    } catch (error: any) {
      console.error('❌ Password reset process failed:', error);
      return NextResponse.json({
        error: 'Password reset failed',
        message: 'Unable to reset password. Please try requesting a new reset link.',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET method for token validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 Validating token:', token?.substring(0, 16) + '...');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 });
    }

    try {
      // Look up token in Firestore
      const tokensRef = collection(db, Collections.PASSWORD_RESET_TOKENS);
      const tokenQuery = query(tokensRef, where('token', '==', token));
      const tokenSnapshot = await getDocs(tokenQuery);

      if (tokenSnapshot.empty) {
        console.log('❌ Token not found');
        return NextResponse.json({ valid: false, error: 'Invalid token' });
      }

      const tokenData = tokenSnapshot.docs[0].data();
      const now = new Date();
      const expiresAt = tokenData.expiresAt.toDate();
      
      if (now > expiresAt) {
        console.log('❌ Token expired');
        return NextResponse.json({ valid: false, error: 'Token expired' });
      }
      
      if (tokenData.used) {
        console.log('❌ Token already used');
        return NextResponse.json({ valid: false, error: 'Token already used' });
      }

      console.log('✅ Token is valid');
      return NextResponse.json({ valid: true, email: tokenData.email });

    } catch (firebaseError: any) {
      console.error('❌ Token validation error:', firebaseError);
      return NextResponse.json({ valid: false, error: 'Validation failed' });
    }

  } catch (error) {
    console.error('❌ GET request error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' });
  }
}