# Quick Email Setup Guide

## 🚧 Current Status
The forgot password system is working but **email service is disabled** for testing. Reset links are shown directly in the browser during development.

## 🚀 Enable Email Service (Optional)

### Step 1: Install Nodemailer
```bash
npm install nodemailer @types/nodemailer
```

### Step 2: Set up Gmail App Password
1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/) > Security > App passwords
3. Generate an app password for "Mail" 
4. Copy the 16-character password

### Step 3: Add Environment Variables
Add to your `.env.local` file:
```env
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### Step 4: Enable Email Service
In `src/app/api/auth/forgot-password/route.ts`, uncomment this line:
```typescript
// Change this:
// import { sendPasswordResetEmail } from '@/lib/email';

// To this:
import { sendPasswordResetEmail } from '@/lib/email';
```

Then replace the TODO section with:
```typescript
// Send password reset email
const emailResult = await sendPasswordResetEmail(email, tokenResult.token);

if (!emailResult.success) {
  console.error('Failed to send reset email:', emailResult.error);
  return NextResponse.json(
    { error: 'Failed to send password reset email. Please try again.' },
    { status: 500 }
  );
}

console.log('✅ Password reset email sent successfully to:', email);
```

### Step 5: Remove Development Mode Features
Remove the development reset link from the response:
```typescript
return NextResponse.json({
  success: true,
  message: 'If an account with this email exists, a password reset link has been sent.'
});
```

## 🧪 Current Testing Flow (No Email)

1. Go to `/login` → Click "Forgot Password?"
2. Enter any email address that exists in your database
3. Click "Send Reset Link"
4. **Copy the reset link** shown in the yellow development box
5. **Paste the link** in a new browser tab to test password reset
6. Set a new password and test login

## ✅ What's Working Now

- ✅ Forgot password form
- ✅ User validation in database  
- ✅ Secure token generation
- ✅ Token storage in Firestore
- ✅ Reset password form with validation
- ✅ Password strength requirements
- ✅ Token validation and expiry
- ✅ Password update in database
- ✅ Success redirect to login

## 📧 What Needs Email Setup

- 📧 Sending reset emails via Gmail SMTP
- 📧 Professional email templates
- 📧 Production-ready email delivery

The system works perfectly for testing without email! 🎉
