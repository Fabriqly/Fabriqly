# Troubleshooting: Notifications Not Appearing

## Issue: Preferences are ON but notifications still don't appear

### Step 1: Check User Preferences

Use the debug endpoint to check everything:

```javascript
// In browser console (as admin)
fetch('/api/test/notifications/debug?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(console.log);
```

This will show:
- User info
- Current preferences
- Whether push is enabled
- Test notification creation result
- Recent notifications

### Step 2: Check What's Happening

The debug endpoint will try to create a test notification and show you:
- ✅ If it succeeds → notification was created
- ❌ If it fails → shows the error message

### Step 3: Common Issues

#### Issue 1: Preferences Check Failing
**Symptom:** Error message: "Notification creation disabled by user preferences"

**Solution:**
- Check if `user.profile.preferences.notifications.push` is actually `true`
- Use the debug endpoint to verify
- Try creating with `bypassPreferences: true` for testing

#### Issue 2: Notification Created But Not Showing
**Symptom:** Debug shows notification was created, but UI doesn't show it

**Possible Causes:**
1. **Firestore Security Rules** - User can't read notifications
2. **Real-time Listener Not Working** - Check browser console for errors
3. **Wrong User ID** - Notification created for different user

**Solutions:**
- Check Firestore console to see if notification exists
- Check browser console for Firestore permission errors
- Verify you're logged in as the correct user

#### Issue 3: Error During Creation
**Symptom:** Error message in debug result

**Check:**
- Server logs for detailed error
- User document exists in Firestore
- User has a profile

### Step 4: Test Notification Creation

#### Method 1: Using Test API (Bypasses Preferences)
```javascript
fetch('/api/test/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'system_announcement',
    count: 1,
    userId: 'YOUR_USER_ID',
    bypassPreferences: true  // This bypasses preferences check
  })
})
.then(r => r.json())
.then(console.log);
```

#### Method 2: Using Normal API (Respects Preferences)
```javascript
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',
    type: 'system_announcement',
    title: 'Test Announcement',
    message: 'This is a test',
    bypassPreferences: true  // Only works for system_announcement
  })
})
.then(r => r.json())
.then(console.log);
```

### Step 5: Verify in Firestore

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `notifications` collection
4. Filter by `userId == YOUR_USER_ID`
5. Check if notification exists
6. Check `isRead` status
7. Check `createdAt` timestamp

### Step 6: Check UI Components

1. **Notification Bell:**
   - Check if badge count is correct
   - Check browser console for errors
   - Check if Firestore listener is connected

2. **Notification Dropdown:**
   - Click bell icon
   - Check if notifications appear
   - Check if real-time updates work

3. **Notifications Page:**
   - Go to `/notifications`
   - Check if notifications are listed
   - Check filters and pagination

## Quick Debug Checklist

- [ ] User preferences exist and `push: true`
- [ ] User document exists in Firestore
- [ ] Notification was created (check Firestore)
- [ ] Firestore security rules allow read access
- [ ] Real-time listener is working (check console)
- [ ] Correct user ID used
- [ ] No errors in browser console
- [ ] No errors in server logs

## Still Not Working?

1. **Check Server Logs:**
   - Look for errors when creating notification
   - Check for preference check failures
   - Check for Firestore errors

2. **Check Browser Console:**
   - Look for Firestore permission errors
   - Look for real-time listener errors
   - Check network tab for API errors

3. **Verify User:**
   - Make sure you're logged in as the correct user
   - Check user ID matches
   - Verify user role and permissions

4. **Test with Bypass:**
   - Use `bypassPreferences: true` to skip preference check
   - This helps isolate if the issue is preferences or something else

