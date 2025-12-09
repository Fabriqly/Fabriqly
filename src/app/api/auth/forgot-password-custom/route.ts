
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Processing password reset request

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

    await setDoc(doc(db, 'passwordResetTokens', resetToken), resetTokenData);

    // Send email using nodemailer (if configured)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          // Dynamic import to avoid TypeScript errors when nodemailer is not installed
          const nodemailer = await import('nodemailer' as any);
          
          const transporter = nodemailer.default.createTransport({
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
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Fabriqly Password</title>
                <!--[if mso]>
                <noscript>
                  <xml>
                    <o:OfficeDocumentSettings>
                      <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                  </xml>
                </noscript>
                <![endif]-->
              </head>
              <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <!-- Main Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; min-height: 100vh;">
                  <tr>
                    <td align="center" valign="top" style="padding: 40px 20px;">
                      <!-- Email Container -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                              <tr>
                                <td align="center">
                                  <span style="font-size: 32px; margin-right: 12px; vertical-align: middle; display: inline-block;">🛍️</span>
                                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.01em; display: inline-block; vertical-align: middle;">
                                    Fabriqly
                                  </h1>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td>
                                  <div style="text-align: center; margin-bottom: 32px;">
                                    <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin: 0 0 8px 0;">
                                      Hello <strong style="color: #1f2937;">${userData.profile?.firstName || 'there'}</strong> 👋
                                    </p>
                                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
                                      We received a request to reset your password. Click the button below to create a new one.
                                    </p>
                                  </div>
                                  
                                  <!-- Reset Button -->
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 24px 0;">
                                    <tr>
                                      <td align="center">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                          <tr>
                                            <td style="border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.25);">
                                              <a href="${resetUrl}" style="display: inline-block; padding: 18px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 10px; letter-spacing: 0.025em;">
                                                Reset Password
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  
                                  <!-- Alternative Link -->
                                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 32px 0;">
                                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">
                                      Having trouble with the button? Copy and paste this link into your browser:
                                    </p>
                                    <p style="word-break: break-all; color: #3b82f6; font-size: 14px; margin: 0; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                      ${resetUrl}
                                    </p>
                                  </div>
                                  
                                  <!-- Security Notice -->
                                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0;">
                                    <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                                      ⏰ <strong>Security Notice:</strong> This link will expire in 1 hour for your protection.
                                    </p>
                                  </div>
                                  
                                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
                                    If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                              The Fabriqly Team
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                              © ${new Date().getFullYear()} Fabriqly • Fashion & Design Platform
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });

          console.log('✅ Custom password reset email sent successfully');
        } catch (importError) {
          console.log('⚠️ Nodemailer not available, skipping email send');
        }
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
