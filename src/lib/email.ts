// lib/email.ts - Email service using Nodemailer with Gmail SMTP
// Note: Install nodemailer with: npm install nodemailer @types/nodemailer
import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER, // Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail app password (not regular password)
  },
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

// Verify transporter configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

// Email templates
const getPasswordResetEmailTemplate = (resetLink: string, userEmail: string) => {
  return {
    subject: 'Reset Your Fabriqly Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8fafc;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .card {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #64748b;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🔐 Reset Your Password</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Fabriqly Account Recovery</p>
              </div>
              
              <div class="content">
                <p>Hello,</p>
                <p>We received a request to reset the password for your Fabriqly account associated with <strong>${userEmail}</strong>.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset My Password</a>
                </div>
                
                <div class="warning">
                  <p style="margin: 0; font-size: 14px;"><strong>⚠️ Important:</strong></p>
                  <ul style="margin: 10px 0 0 0; font-size: 14px;">
                    <li>This link will expire in <strong>1 hour</strong></li>
                    <li>This link can only be used once</li>
                    <li>If you didn't request this, please ignore this email</li>
                  </ul>
                </div>
                
                <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <code style="background: #f1f5f9; padding: 5px; border-radius: 3px; word-break: break-all;">${resetLink}</code>
                </p>
              </div>
              
              <div class="footer">
                <p>This email was sent by Fabriqly</p>
                <p>If you have any questions, please contact our support team.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reset Your Fabriqly Password
      
      Hello,
      
      We received a request to reset the password for your Fabriqly account (${userEmail}).
      
      Click the link below to reset your password:
      ${resetLink}
      
      Important:
      - This link will expire in 1 hour
      - This link can only be used once
      - If you didn't request this, please ignore this email
      
      If you have any questions, please contact our support team.
      
      Best regards,
      The Fabriqly Team
    `
  };
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string, 
  resetToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Construct reset link
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    // Get email template
    const emailTemplate = getPasswordResetEmailTemplate(resetLink, email);
    
    // Send email
    const info = await transporter.sendMail({
      from: {
        name: 'Fabriqly',
        address: process.env.GMAIL_USER!
      },
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Send email verification (for future use)
export const sendVerificationEmail = async (
  email: string, 
  verificationToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
    
    const info = await transporter.sendMail({
      from: {
        name: 'Fabriqly',
        address: process.env.GMAIL_USER!
      },
      to: email,
      subject: 'Verify Your Fabriqly Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Fabriqly!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationLink}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email Address
          </a>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
      text: `Welcome to Fabriqly! Please verify your email address: ${verificationLink}`
    });

    console.log('✅ Verification email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
