// SIMPLE SINGLE EMAIL - Beautiful Fabriqly email that links directly to Firebase reset
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('🎨 SIMPLE SINGLE EMAIL PASSWORD RESET');
    console.log('📧 Email:', email);

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
      // Step 1: Send Firebase password reset email with our custom redirect URL
      console.log('🔥 Sending Firebase password reset...');
      
      const actionCodeSettings: ActionCodeSettings = {
        url: `${process.env.NEXTAUTH_URL}/reset-password-firebase`,
        handleCodeInApp: false,
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('✅ Firebase password reset sent');

      // Step 2: Check if we can send a beautiful notification email
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;
      
      if (gmailUser && gmailPassword) {
        try {
          console.log('📧 Sending beautiful Fabriqly notification...');
          
          // Create transporter
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailPassword
            }
          });

          // Beautiful notification email (doesn't contain reset link, just notification)
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Request - Fabriqly</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px;">🔐 Password Reset</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Fabriqly Account Security</p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Password Reset Requested 🛡️</h2>
                  
                  <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    We've received a request to reset your Fabriqly account password. For your security, we've sent you a password reset email.
                  </p>

                  <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 15px; padding: 25px; margin: 25px 0; border-left: 4px solid #667eea;">
                    <p style="color: #2d3748; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">📧 Check Your Email</p>
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.5; margin: 0;">
                      Look for an email with the subject <strong>"Reset your password for Fabriqly"</strong> and click the reset link inside to continue.
                    </p>
                  </div>

                  <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 12px; padding: 20px; margin: 25px 0;">
                    <p style="color: #22543d; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">✨ What to do next:</p>
                    <ol style="color: #2f855a; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Look for the password reset email</li>
                      <li>Click the reset link in that email</li>
                      <li>Set your new secure password</li>
                      <li>Log in with your new credentials</li>
                    </ol>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #718096; font-size: 14px; margin: 0;">
                      If you didn't request this reset, you can safely ignore this email.
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                    Best regards,<br>
                    <strong style="color: #2d3748;">The Fabriqly Team</strong>
                  </p>
                  <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    This email was sent to ${email}. If you didn't request this, please ignore this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          await transporter.sendMail({
            from: `"Fabriqly Security" <${gmailUser}>`,
            to: email,
            subject: '🔐 Password Reset Requested - Fabriqly',
            html: htmlContent
          });

          console.log('✅ Beautiful Fabriqly notification sent');
          
          return NextResponse.json({
            success: true,
            message: 'Password reset emails sent! Check your inbox.',
            email: email,
            method: 'firebase_with_notification',
            instructions: [
              'Check your email for TWO emails:',
              '1. Beautiful Fabriqly notification (confirms your request)',
              '2. Password reset link from Firebase (use this to reset)',
              'Click the reset link in the Firebase email to continue'
            ]
          });
          
        } catch (emailError) {
          console.log('⚠️ Fabriqly notification failed, but Firebase reset sent');
          
          return NextResponse.json({
            success: true,
            message: 'Password reset email sent! Check your inbox.',
            email: email,
            method: 'firebase_only',
            instructions: [
              'Check your email inbox for a password reset email',
              'Click the reset link in the email',
              'Set your new password',
              'Log in with your new credentials'
            ]
          });
        }
      } else {
        // No email service configured, just Firebase
        return NextResponse.json({
          success: true,
          message: 'Password reset email sent! Check your inbox.',
          email: email,
          method: 'firebase_only',
          instructions: [
            'Check your email inbox for a password reset email',
            'Click the reset link in the email',
            'Set your new password',
            'Log in with your new credentials'
          ]
        });
      }
      
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
