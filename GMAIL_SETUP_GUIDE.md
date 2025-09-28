# 📧 Gmail Email Setup Guide

## 🎯 Goal
Send **real password reset emails** to users' Gmail accounts.

## 🔧 Setup Steps

### Step 1: Choose Your System Gmail
Pick any Gmail account you control to **send emails FROM**:
- Your personal Gmail: `yourname@gmail.com`
- Business Gmail: `business@gmail.com`  
- Dedicated system Gmail: `fabriqly.system@gmail.com`

### Step 2: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Sign in with your chosen Gmail
3. Enable **2-Step Verification** if not already enabled

### Step 3: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"** as the app
3. Click **"Generate"**
4. Copy the **16-character password** (like `abcd1234efgh5678`)

### Step 4: Update .env.local
```env
# Gmail configuration (system sends emails FROM this address)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Example:
GMAIL_USER=john.doe@gmail.com
GMAIL_APP_PASSWORD=abcd1234efgh5678
```

### Step 5: Restart Server
```bash
# Stop server: Ctrl+C
# Start server: npm run dev
```

## 🧪 Test the System

### Test Flow:
1. **Go to**: `http://localhost:3000/forgot-password`
2. **Enter any email**: `test@gmail.com` (or any real email)
3. **Click**: "Send Reset Link" 
4. **Check email**: The user should receive an email in their Gmail inbox
5. **Click reset link**: In the email to complete password reset

### Expected Results:
- ✅ **Email sent successfully** message on website
- ✅ **Real email received** in user's Gmail inbox
- ✅ **Beautiful HTML email** with reset button
- ✅ **Reset link works** when clicked

## 🎉 How It Works

### Email Flow:
```
User enters: user@gmail.com
↓
System sends FROM: your-system@gmail.com  
↓
Email delivered TO: user@gmail.com
↓
User clicks reset link in their email
↓
Password reset form opens
```

### Benefits:
- ✅ **Real email delivery** to any Gmail address
- ✅ **Professional HTML emails** with your branding
- ✅ **Secure reset tokens** with expiration
- ✅ **Works with any user email** automatically

## 🚨 Common Issues

### "Email system not configured"
- Check: `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local`
- Make sure to restart server after changes

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- Use **App Password**, not regular Gmail password
- Remove any spaces/dashes from app password
- Make sure 2FA is enabled on Gmail account

### "Network connection issue"
- Check internet connection
- Try different Gmail account
- Verify Gmail account is not suspended

## ✅ Success Indicators
- Console shows: `🎉 EMAIL SENT SUCCESSFULLY!`
- User receives email in Gmail inbox
- Reset link in email works correctly
- Professional-looking HTML email template
