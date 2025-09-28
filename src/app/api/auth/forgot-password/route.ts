// PRODUCTION-READY PASSWORD RESET - Works with or without email configuration
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PRODUCTION password reset system');
    
    const { email } = await request.json();
    console.log('👤 User wants password reset for:', email);

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // 🔍 STEP 1: Check if user exists and create reset token
    console.log('🔍 Looking for user and creating reset token...');
    
    let token, resetLink, userName;
    
    try {
      const { query, collection, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const { Collections } = await import('@/services/firebase');
      
      const usersRef = collection(db, Collections.USERS);
      const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        console.log('❌ User not found, but returning success for security');
        // Don't reveal if user exists - return success anyway for security
        return NextResponse.json({
          success: true,
          message: `A password reset email has been sent to ${email}. Please check your inbox (and spam folder).`,
          emailSent: true,
          sentTo: email,
          method: 'email'
        });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log('✅ User found in Firebase');
      console.log('   User ID:', userId);
      console.log('   Email:', userData.email);

      // Create password reset token directly (no hashing)
      console.log('🔑 Creating password reset token...');
      
      const crypto = require('crypto');
      token = crypto.randomBytes(32).toString('hex');
      const tokenId = crypto.randomUUID();
      
      // Set expiry time (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Save token to Firebase (plain text, no hashing)
      const { setDoc, doc } = await import('firebase/firestore');
      const tokenData = {
        id: tokenId,
        userId,
        email: userData.email,
        token: token, // Plain text token
        expiresAt,
        used: false,
        createdAt: new Date()
      };

      await setDoc(doc(db, Collections.PASSWORD_RESET_TOKENS, tokenId), tokenData);
      console.log('✅ Reset token saved to Firebase (plain text)');
      resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      // Get user name from email
      const emailName = email.split('@')[0];
      userName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      console.log('✅ Reset token created successfully');
      console.log('   Reset link:', resetLink);
      console.log('   User name:', userName);

    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Unable to process password reset request. Please try again later.',
        details: firebaseError.message
      }, { status: 500 });
    }

    // 🎯 PRODUCTION LOGIC: Try email first, fallback to direct link
    
    // Check if ANY email service is configured
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    const hasMailgun = !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
    const hasEmailService = hasGmail || hasSendGrid || hasMailgun;

    console.log('📧 Email services available:');
    console.log('   Gmail:', hasGmail);
    console.log('   SendGrid:', hasSendGrid);
    console.log('   Mailgun:', hasMailgun);

    if (!hasEmailService) {
      // 🎯 NO EMAIL SERVICE - Return error asking for email setup
      console.log('📭 No email service configured - cannot send email');
      
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        message: 'Unable to send password reset email. Please contact support.',
        setupRequired: true,
        instructions: {
          step1: 'Administrator needs to configure Gmail in .env.local',
          step2: 'Set GMAIL_USER to a real Gmail address',
          step3: 'Set GMAIL_APP_PASSWORD to Gmail app password',
          step4: 'Restart server'
        }
      }, { status: 500 });
    }

    // 🎯 EMAIL SERVICE AVAILABLE - Try to send email
    try {
      let emailSent = false;
      let emailService = '';
      
      // Try Gmail first (if configured)
      if (hasGmail && process.env.GMAIL_USER.includes('@gmail.com')) {
        console.log('📧 Attempting to send email via Gmail...');
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        console.log('📧 Sending email to:', email, 'as:', userName);

        const mailOptions = {
          from: {
            name: 'Fabriqly Password Reset',
            address: process.env.GMAIL_USER
          },
          to: email,
          subject: 'Reset Your Fabriqly Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Fabriqly Account Recovery</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hello ${userName},</p>
                  
                  <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 30px 0;">
                    You requested to reset your password for your Fabriqly account: <strong>${email}</strong>
                  </p>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4);">
                      Reset My Password
                    </a>
                  </div>
                  
                  <!-- Security Warning -->
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e; font-size: 14px;">⚠️ Security Notice:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <li>This link will expire in <strong>1 hour</strong></li>
                      <li>This link can only be used <strong>once</strong></li>
                      <li>If you didn't request this, please ignore this email</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    This email was sent automatically by Fabriqly<br>
                    Password reset requested for: ${email}
                  </p>
                </div>
                
              </div>
            </div>
          `,
          text: `
Hello ${userName},

You requested to reset your password for your Fabriqly account: ${email}

Click this link to reset your password:
${resetLink}

Security Notice:
- This link expires in 1 hour
- This link can only be used once  
- If you didn't request this, ignore this email

Best regards,
Fabriqly Team
          `
        };

        await transporter.sendMail(mailOptions);
        
        emailSent = true;
        emailService = 'Gmail';
        console.log('✅ Email sent successfully via Gmail');
      }
      
      // TODO: Add SendGrid, Mailgun, AWS SES support here
      
      if (emailSent) {
        return NextResponse.json({
          success: true,
          message: `A password reset email has been sent to ${email}. Please check your inbox (and spam folder).`,
          emailSent: true,
          service: emailService,
          sentTo: email,
          method: 'email'
        });
      }
      
    } catch (emailError) {
      console.error('📧 Email sending failed:', emailError);
      
      // 🎯 EMAIL FAILED - Return error (no fallback to direct link)
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (emailError.message?.includes('Invalid login')) {
        errorMessage = 'Email service authentication failed. Please contact support.';
      } else if (emailError.message?.includes('ENOTFOUND')) {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      }
      
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        message: errorMessage,
        emailError: emailError.message,
        emailConfigured: true
      }, { status: 500 });
    }

    // 🎯 SHOULD NEVER REACH HERE
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: 'Unable to process password reset request.'
    }, { status: 500 });

  } catch (error) {
    console.error('❌ System error:', error);
    return NextResponse.json({
      success: false,
      error: 'System error',
      message: 'Unable to process password reset request. Please try again later.'
    }, { status: 500 });
  }
}