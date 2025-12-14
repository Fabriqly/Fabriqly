# User Preferences Explained

## What Are User Preferences?

User preferences are **settings stored in each user's profile** that control how the application behaves for that specific user. They allow users to customize their experience, including notification settings, theme preferences, and more.

## Where Are Preferences Stored?

Preferences are stored in the **Firestore `users` collection** as part of the user document:

```
users/{userId}
  └── profile
      └── preferences
          ├── notifications
          │   ├── email: boolean
          │   ├── sms: boolean
          │   └── push: boolean
          └── theme: 'light' | 'dark'
```

## Structure in Code

```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  profile?: {
    preferences?: {
      notifications?: {
        email: boolean;    // Email notifications
        sms: boolean;      // SMS notifications
        push: boolean;     // In-app notifications (bell icon)
      };
      theme?: 'light' | 'dark';
    };
  };
}
```

## Notification Preferences

### 1. **Email Notifications** (`email: boolean`)
- Controls whether the user receives notifications via email
- **Future feature**: Currently not implemented, but structure is ready
- Default: `true` (when user is created)

### 2. **SMS Notifications** (`sms: boolean`)
- Controls whether the user receives notifications via SMS
- **Future feature**: Currently not implemented, but structure is ready
- Default: `false` (when user is created)

### 3. **Push/In-App Notifications** (`push: boolean`)
- **This is the one that matters for the notification bell icon!**
- Controls whether in-app notifications are created and shown
- If `push: false`, notifications won't be created at all
- If `push: true` or not set, notifications will be created
- Default: `true` (when user is created)

## How Preferences Work

### Default Behavior

When a new user is created, default preferences are set:

```typescript
preferences: {
  notifications: {
    email: true,   // Email enabled by default
    sms: false,   // SMS disabled by default
    push: true    // In-app notifications enabled by default
  },
  theme: 'light'
}
```

### Checking Preferences

The `NotificationService` checks preferences before creating notifications:

```typescript
// In NotificationService.shouldCreateNotification()
const preferences = user.profile?.preferences?.notifications;

if (!preferences) {
  return true; // Default to enabled if not set
}

// Check if push notifications are enabled
return preferences.push !== false; // Default to true if not set
```

**Logic:**
- If preferences don't exist → **Notifications enabled** (default)
- If `push: true` → **Notifications enabled**
- If `push: false` → **Notifications disabled**
- If `push` is not set → **Notifications enabled** (default)

## Examples

### Example 1: User with Default Preferences
```json
{
  "id": "user123",
  "email": "user@example.com",
  "profile": {
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  }
}
```
**Result:** ✅ Notifications will be created (push is true)

### Example 2: User with Notifications Disabled
```json
{
  "id": "user456",
  "email": "user2@example.com",
  "profile": {
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": false  // ← Disabled!
      }
    }
  }
}
```
**Result:** ❌ Notifications will NOT be created (push is false)

### Example 3: User with No Preferences
```json
{
  "id": "user789",
  "email": "user3@example.com"
  // No profile.preferences set
}
```
**Result:** ✅ Notifications will be created (defaults to enabled)

## How to Check User Preferences

### Method 1: Via Admin Test API
```bash
GET /api/test/notifications/check-user?userId=USER_ID
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "email": "user@example.com",
    "role": "customer",
    "preferences": {
      "exists": true,
      "push": true,
      "pushEnabled": true,
      "email": true,
      "sms": false
    },
    "preferencesPath": "user.profile.preferences.notifications"
  }
}
```

### Method 2: Check Firestore Directly
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `users` collection
4. Find user document
5. Check `profile.preferences.notifications.push`

### Method 3: Via Code
```typescript
const userRepo = new UserRepository();
const user = await userRepo.findById(userId);
const pushEnabled = user.profile?.preferences?.notifications?.push !== false;
```

## How Preferences Affect Notifications

### When Notification is Created:

1. **Event occurs** (e.g., order created)
2. **Event handler** calls `NotificationService.sendNotification()`
3. **Service checks preferences:**
   ```typescript
   const shouldCreate = await shouldCreateNotification(userId, type);
   ```
4. **If `push: true` or not set:**
   - ✅ Notification is created
   - ✅ Appears in notification bell
   - ✅ User sees it in UI
5. **If `push: false`:**
   - ❌ Notification is NOT created
   - ❌ No error thrown (silently skipped)
   - ❌ User doesn't see it

## Why Some Users Don't Get Notifications

If a customer user doesn't receive notifications, check:

1. **User preferences:**
   ```bash
   GET /api/test/notifications/check-user?userId=CUSTOMER_ID
   ```
   - If `pushEnabled: false`, that's why!

2. **User exists:**
   - Check if user document exists in Firestore
   - Check if user has a profile

3. **Preferences structure:**
   - Check if `user.profile.preferences.notifications` exists
   - Check if `push` is explicitly set to `false`

## How to Update Preferences

### Currently (Manual):
Preferences can be updated directly in Firestore or via code:

```typescript
// Enable notifications
await userRepo.update(userId, {
  'profile.preferences.notifications.push': true
});

// Disable notifications
await userRepo.update(userId, {
  'profile.preferences.notifications.push': false
});
```

### Future: User Settings Page
Users should be able to update preferences via a settings page:
- `/dashboard/settings` or `/profile/settings`
- Toggle switches for each notification type
- Save preferences to Firestore

## Summary

| Setting | What It Controls | Default | Current Status |
|---------|-----------------|---------|----------------|
| `email` | Email notifications | `true` | ⚠️ Not implemented yet |
| `sms` | SMS notifications | `false` | ⚠️ Not implemented yet |
| `push` | In-app notifications (bell icon) | `true` | ✅ **Active** |
| `theme` | Light/dark mode | `'light'` | ⚠️ Not implemented yet |

## Key Points

1. **`push` is the only active preference** - Controls in-app notifications
2. **Default is enabled** - If preferences don't exist, notifications work
3. **Silent failure** - If disabled, notifications are skipped without error
4. **Per-user setting** - Each user can have different preferences
5. **Stored in Firestore** - Part of user document in `users` collection

## Testing Preferences

### Test with Preferences Enabled:
```javascript
// User has push: true (or not set)
// Result: ✅ Notification created
```

### Test with Preferences Disabled:
```javascript
// User has push: false
// Result: ❌ Notification NOT created (silently skipped)
```

### Bypass for Testing:
```javascript
// Test API bypasses preferences
fetch('/api/test/notifications', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user123',
    bypassPreferences: true  // ← Skips preference check
  })
});
```

## Common Questions

**Q: Why doesn't my customer user get notifications?**  
A: Check if `user.profile.preferences.notifications.push === false`

**Q: What's the default value?**  
A: If preferences don't exist, notifications are enabled by default

**Q: Can I change preferences?**  
A: Yes, update the user document in Firestore or via code

**Q: Do preferences affect test notifications?**  
A: Test API can bypass preferences with `bypassPreferences: true`

**Q: Where are preferences stored?**  
A: Firestore `users/{userId}/profile/preferences/notifications`

