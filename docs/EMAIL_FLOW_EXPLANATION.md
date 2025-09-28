# 📧 Automatic Email Flow Explanation

## 🎯 How It Should Work

### **Environment Variables (One-Time Setup)**
```env
# Admin Gmail Account (Sends ALL emails)
GMAIL_USER=admin@yourbusiness.com           # Your admin Gmail
GMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop      # Your admin Gmail app password
```

### **Automatic Flow**
```
1. User visits website → Clicks "Forgot Password"
2. User enters THEIR email: john.doe@gmail.com
3. System checks Firebase for user with that email
4. System automatically sends email:
   FROM: admin@yourbusiness.com (your admin account)
   TO: john.doe@gmail.com (user's personal email)
5. User receives email in THEIR Gmail inbox
```

## ✅ **What You Set Up Once**
- Your admin Gmail credentials in .env.local
- Gmail App Password for your admin account

## 🚀 **What Happens Automatically**
- System finds any user's email in Firebase
- System sends password reset TO that user's Gmail
- No manual configuration needed for each user

## 📝 **Example**
- Admin Gmail: `fabriqly.admin@gmail.com`
- User 1 email: `alice@gmail.com` → Gets reset email automatically
- User 2 email: `bob@yahoo.com` → Gets reset email automatically  
- User 3 email: `charlie@outlook.com` → Gets reset email automatically

**You NEVER add user emails to .env file!**
