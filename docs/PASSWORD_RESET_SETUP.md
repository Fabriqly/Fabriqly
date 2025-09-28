# Password Reset System Setup

## 🎯 Overview

This document explains how to set up the custom password reset system for Fabriqly. The system uses Gmail SMTP with Nodemailer to send password reset emails and implements secure token-based password reset functionality.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

### 2. Environment Variables

Add these variables to your `.env.local` file:

```env
# Gmail SMTP Configuration (for password reset emails)
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### 3. Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/) > Security > App passwords
3. Generate an app password for "Mail"
4. Use that 16-character password in `GMAIL_APP_PASSWORD` (not your regular Gmail password)

## 🔄 Password Reset Flow

```
[User clicks "Forgot Password"]
        |
        v
[Enter Gmail address] ----> [Server checks user exists]
        |
        v
[Generate secure token + expiry, save hash]
        |
        v
[Send reset link using Gmail SMTP (Nodemailer)]
        |
        v
[User opens Gmail -> clicks reset link]
        |
        v
[Server validates token & expiry]
   |-----------------------------|
   |Valid                        |Invalid
   v                             v
[Show New Password form]     [Error: link expired/invalid]
        |
        v
[Update password in DB, mark token used]
        |
        v
[Show success message -> Redirect to login]
```

## 🏗️ System Architecture

### Database Schema

**Password Reset Tokens Collection** (`passwordResetTokens`):
```typescript
interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;      // Bcrypt hashed token
  expiresAt: Date;        // 1 hour expiry
  used: boolean;          // Prevents reuse
  createdAt: Date;
}
```

### API Endpoints

- **POST** `/api/auth/forgot-password` - Request password reset
- **GET** `/api/auth/reset-password?token=xxx` - Validate reset token
- **POST** `/api/auth/reset-password` - Reset password with token

### Pages

- `/forgot-password` - Email input form
- `/reset-password?token=xxx` - New password form

## 🔐 Security Features

### Token Security
- **Cryptographically secure** tokens (32 bytes random)
- **Bcrypt hashed** storage (never store plain tokens)
- **1-hour expiry** time
- **Single-use** tokens (marked as used after password reset)
- **Automatic cleanup** of old/expired tokens

### Email Security
- **No email enumeration** (always returns success message)
- **Rate limiting** ready (implement if needed)
- **Secure email templates** with clear expiry warnings

### Password Security
- **Strong password requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Bcrypt hashing** with salt rounds of 12
- **Real-time password strength validation**

## 📧 Email Template Features

- **Responsive HTML design** with fallback text version
- **Professional branding** with Fabriqly styling
- **Clear security warnings** about link expiry and single use
- **Copy-paste link** as fallback for button clicks
- **Mobile-friendly** design

## 🛠️ Development & Testing

### Test the Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test forgot password**:
   - Go to `/login`
   - Click "Forgot Password"
   - Enter a valid email address
   - Check your Gmail for the reset email

3. **Test password reset**:
   - Click the reset link in the email
   - Set a new password
   - Verify login with new password

### Email Service Verification

The system includes email service verification. Check the console logs for:
- ✅ Email service is ready
- ❌ Email service configuration error

## 🚨 Troubleshooting

### Common Issues

1. **Gmail authentication failed**:
   - Ensure 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check for typos in environment variables

2. **Token validation fails**:
   - Check if token has expired (1 hour limit)
   - Verify token hasn't been used already
   - Ensure proper URL encoding of token

3. **Password update fails**:
   - Check user exists in database
   - Verify password meets requirements
   - Check Firestore permissions

### Debug Mode

Add this to your `.env.local` for detailed logging:
```env
NODE_ENV=development
```

## 🔄 Maintenance

### Token Cleanup

The system includes a utility function to clean up expired tokens:

```typescript
import { cleanupExpiredTokens } from '@/lib/password-reset';

// Run periodically (e.g., daily cron job)
await cleanupExpiredTokens();
```

### Monitoring

Monitor these metrics:
- Password reset request frequency
- Token validation success rate
- Email delivery success rate
- Failed password reset attempts

## 🎨 Customization

### Email Template

Modify the email template in `/src/lib/email.ts`:
- Update branding colors
- Change email copy
- Add additional security warnings
- Customize styling

### Password Requirements

Adjust password requirements in `/src/app/api/auth/reset-password/route.ts`:
- Minimum length
- Character requirements
- Custom validation rules

### Token Expiry

Change token expiry time in `/src/lib/password-reset.ts`:
```typescript
// Current: 1 hour
expiresAt.setHours(expiresAt.getHours() + 1);

// Example: 30 minutes
expiresAt.setMinutes(expiresAt.getMinutes() + 30);
```

## 📝 Next Steps

1. **Install Nodemailer**: `npm install nodemailer @types/nodemailer`
2. **Set up Gmail App Password** following the guide above
3. **Add environment variables** to `.env.local`
4. **Test the complete flow** with a real email address
5. **Customize email template** to match your branding
6. **Set up monitoring** for production use

The password reset system is now ready to use! 🎉
