// SIMPLE FIREBASE PASSWORD RESET - Just sends Firebase's native email
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('📧 SIMPLE FIREBASE PASSWORD RESET');
    console.log('Email:', email);

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    try {
      // Send Firebase's native password reset email
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Firebase password reset email sent successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent! Check your inbox.',
        email: email,
        method: 'firebase_native'
      });
      
    } catch (firebaseError: any) {
      console.error('❌ Firebase password reset failed:', firebaseError);
      
      if (firebaseError.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: false,
          error: 'No account found with this email address',
          message: 'Please check your email or create a new account.'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email',
        message: 'Please try again later.',
        details: firebaseError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
