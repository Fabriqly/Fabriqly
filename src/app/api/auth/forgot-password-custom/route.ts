import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('📧 CUSTOM PASSWORD RESET');
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

    // Check if user exists in Firestore
    const usersRef = collection(db, Collections.USERS);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No account found with this email address',
        message: 'Please check your email or create a new account.'
      }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    // Store reset token in Firestore
    const resetTokenData = {
      email,
      token: resetToken,
      expiresAt: Timestamp.fromDate(resetExpiry),
      used: false,
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, Collections.PASSWORD_RESET_TOKENS, resetToken), resetTokenData);

    // Send email using nodemailer (if configured)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@fabriqly.com',
          to: email,
          subject: 'Reset Your Fabriqly Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Your Password</h2>
              <p>Hello ${userData.profile?.firstName || 'User'},</p>
              <p>You requested a password reset for your Fabriqly account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This email was sent from Fabriqly. If you have any questions, please contact support.
              </p>
            </div>
          `,
        });

        console.log('✅ Custom password reset email sent successfully');
      } else {
        console.log('⚠️ SMTP not configured, skipping email send');
      }
    } catch (emailError) {
      console.error('❌ Failed to send custom email:', emailError);
      // Continue anyway - the reset token is still created
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent! Check your inbox.',
      email: email,
      method: 'custom',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined // Only show token in dev
    });

  } catch (error) {
    console.error('❌ Custom password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
