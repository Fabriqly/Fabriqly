# Notification System Testing Guide

## Quick Start Testing

### Method 1: Using Test API Endpoint (Easiest)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Login as admin** and navigate to any page

3. **Open browser console** (F12) and run:
   ```javascript
   // Create a test notification
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       type: 'system_announcement',
       count: 1
     })
   })
   .then(r => r.json())
   .then(console.log);
   ```

4. **Check the notification bell** - You should see:
   - Badge count increases
   - Notification appears in dropdown
   - Real-time update (no page refresh needed)

### Method 2: Using CLI Script

1. **Compile TypeScript:**
   ```bash
   npm run build
   ```

2. **Run test script:**
   ```bash
   # Create single test notification
   node scripts/test-notifications.js

   # Create multiple notifications
   node scripts/test-notifications.js --count 5

   # Create one of each type
   node scripts/test-notifications.js --all-types

   # Create for specific user
   node scripts/test-notifications.js --user-id USER_ID --count 3
   ```

3. **Check UI** - Notifications should appear in the bell icon

### Method 3: Direct API Call (curl/Postman)

```bash
# Create test notification
curl -X POST http://localhost:3000/api/test/notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "type": "order_created",
    "count": 1
  }'
```

## Testing Checklist

### ✅ Basic Functionality

- [ ] **Notification Creation**
  - Create notification via API
  - Verify notification appears in Firestore
  - Check notification has correct structure

- [ ] **UI Display**
  - Notification bell shows unread count badge
  - Badge count is accurate
  - Dropdown shows recent notifications
  - Notifications display correctly

- [ ] **Real-Time Updates**
  - Create notification while page is open
  - Badge count updates automatically (no refresh)
  - New notification appears in dropdown
  - No page reload needed

- [ ] **Mark as Read**
  - Click on notification
  - Verify it's marked as read
  - Badge count decreases
  - Notification moves to read state

- [ ] **Delete Notification**
  - Delete a notification
  - Verify it's removed from list
  - Badge count updates if it was unread

### ✅ Event-Driven Notifications

- [ ] **User Created Event**
  - Create a new user
  - Verify welcome notification is created
  - Check notification type is 'user_welcome'

- [ ] **Product Published Event**
  - Publish a product
  - Verify notification is sent to business owner
  - Check notification type is 'product_published'

- [ ] **Order Created Event**
  - Create an order
  - Verify customer receives notification
  - Check notification type is 'order_created'

### ✅ Different Notification Types

Test each notification type:
- [ ] `order_created`
- [ ] `order_status_changed`
- [ ] `order_cancelled`
- [ ] `order_payment_received`
- [ ] `order_payment_failed`
- [ ] `customization_request_created`
- [ ] `customization_designer_assigned`
- [ ] `customization_design_completed`
- [ ] `product_published`
- [ ] `user_welcome`
- [ ] `system_announcement`

### ✅ Categories and Priorities

- [ ] **Info Category** - Blue/info styling
- [ ] **Success Category** - Green/success styling
- [ ] **Warning Category** - Yellow/warning styling
- [ ] **Error Category** - Red/error styling

- [ ] **Low Priority** - Normal display
- [ ] **Medium Priority** - Normal display
- [ ] **High Priority** - Highlighted
- [ ] **Urgent Priority** - Prominently displayed

### ✅ User Preferences

- [ ] **Notifications Enabled**
  - User has `preferences.notifications.push: true`
  - Notifications are created

- [ ] **Notifications Disabled**
  - User has `preferences.notifications.push: false`
  - Notifications are NOT created
  - No error thrown

## Step-by-Step UI Testing

### Test 1: Create and View Notification

1. **Login as admin**
2. **Open browser console** (F12)
3. **Create test notification:**
   ```javascript
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ type: 'system_announcement', count: 1 })
   });
   ```
4. **Watch the notification bell:**
   - Badge should appear with count "1"
   - Badge should be orange/red
5. **Click the bell:**
   - Dropdown should open
   - Notification should be visible
   - Should show title and message
6. **Click the notification:**
   - Should mark as read
   - Badge count should decrease to 0
   - Notification should still be visible but marked as read

### Test 2: Real-Time Updates

1. **Keep page open** (don't refresh)
2. **Open another tab** or use API to create notification
3. **Watch the bell icon:**
   - Badge should update automatically
   - No page refresh needed
4. **Click bell:**
   - New notification should appear in dropdown
   - Should be at the top of the list

### Test 3: Multiple Notifications

1. **Create multiple notifications:**
   ```javascript
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ type: 'system_announcement', count: 5 })
   });
   ```
2. **Check badge count:**
   - Should show "5" (or "99+" if more than 99)
3. **Open dropdown:**
   - Should show up to 10 recent notifications
   - Should have "View All Notifications" link
4. **Go to /notifications:**
   - Should see all notifications
   - Should be able to filter and paginate

### Test 4: Different Categories

1. **Create notifications of different categories:**
   ```javascript
   // Success
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       type: 'order_created',
       count: 1
     })
   });
   
   // Warning
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       type: 'order_cancelled',
       count: 1
     })
   });
   
   // Error
   fetch('/api/test/notifications', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       type: 'order_payment_failed',
       count: 1
     })
   });
   ```
2. **Check styling:**
   - Success notifications should be green
   - Warning notifications should be yellow
   - Error notifications should be red
   - Info notifications should be blue

## Testing Event Handlers

### Check if Handlers are Initialized

```bash
# Via API
curl http://localhost:3000/api/test/notifications/check-handlers \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Test Event Emission

1. **Trigger an event that should create a notification:**
   - Create a new user → Should trigger `user_welcome`
   - Publish a product → Should trigger `product_published`
   - Create an order → Should trigger `order_created`

2. **Verify notification is created:**
   - Check Firestore `notifications` collection
   - Check UI for notification
   - Verify notification type matches event

## API Testing

### Get Notifications
```bash
GET /api/notifications?limit=10&isRead=false
```

### Get Unread Count
```bash
GET /api/notifications/unread-count
```

### Mark as Read
```bash
PATCH /api/notifications/[id]
Body: { isRead: true }
```

### Mark All as Read
```bash
POST /api/notifications/read-all
```

### Create Test Notification (Admin)
```bash
POST /api/test/notifications
Body: {
  type: 'system_announcement',
  count: 1,
  userId: 'optional-user-id'
}
```

### Check Event Handlers (Admin)
```bash
GET /api/test/notifications/check-handlers
```

## Expected Behaviors

### ✅ Working Correctly

- Notifications appear within 1-2 seconds
- Badge count updates in real-time
- Clicking notification marks it as read
- Different categories have different colors
- Action URLs work correctly
- Notifications persist in Firestore

### ❌ Common Issues

**Notifications not appearing:**
- Check Firestore security rules
- Verify user preferences (push: true)
- Check browser console for errors
- Verify Firebase Auth is synced

**Real-time not working:**
- Check Firestore listener is set up
- Verify Firebase Auth state
- Check for permission errors
- System should fall back to API polling

**Badge count wrong:**
- Refresh page to sync
- Check unread count API
- Verify notifications are actually unread
- Check for duplicate notifications

## Verification Steps

### 1. Check Firestore
- Go to Firebase Console → Firestore
- Check `notifications` collection
- Verify notifications exist
- Check `isRead` status
- Verify `userId` matches

### 2. Check UI Components
- NotificationBell shows correct count
- NotificationDropdown displays notifications
- NotificationItem shows correct data
- Colors match categories

### 3. Check API Responses
- GET /api/notifications returns correct data
- GET /api/notifications/unread-count returns correct count
- PATCH /api/notifications/[id] marks as read
- POST /api/test/notifications creates notifications

### 4. Check Event Handlers
- GET /api/test/notifications/check-handlers confirms initialization
- Events trigger notifications
- Notification types match events

## Quick Test Script

Save this in browser console and run:

```javascript
// Complete notification system test
async function testNotifications() {
  console.log('🧪 Testing Notification System...\n');
  
  // 1. Check unread count
  const countRes = await fetch('/api/notifications/unread-count');
  const countData = await countRes.json();
  console.log('📊 Current unread count:', countData.data?.count || 0);
  
  // 2. Create test notification
  console.log('📬 Creating test notification...');
  const createRes = await fetch('/api/test/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'system_announcement', count: 1 })
  });
  const createData = await createRes.json();
  console.log('✅ Created:', createData);
  
  // 3. Wait a moment for real-time update
  await new Promise(r => setTimeout(r, 1000));
  
  // 4. Check unread count again
  const countRes2 = await fetch('/api/notifications/unread-count');
  const countData2 = await countRes2.json();
  console.log('📊 New unread count:', countData2.data?.count || 0);
  
  // 5. Get notifications
  const notifsRes = await fetch('/api/notifications?limit=5');
  const notifsData = await notifsRes.json();
  console.log('📋 Recent notifications:', notifsData.data?.length || 0);
  
  console.log('\n✅ Test complete! Check the notification bell icon.');
}

testNotifications();
```

## Troubleshooting

### No Notifications Appearing

1. **Check event handlers:**
   ```bash
   GET /api/test/notifications/check-handlers
   ```

2. **Check user preferences:**
   - User should have `preferences.notifications.push: true`
   - Or preferences should be undefined (defaults to true)

3. **Check Firestore rules:**
   - User should have read access to their notifications
   - Check Firebase Console for permission errors

4. **Check server logs:**
   - Look for errors in notification creation
   - Check for event handler errors

### Real-Time Not Working

1. **Check Firebase Auth:**
   - User should be authenticated
   - Firebase Auth should be synced with NextAuth

2. **Check Firestore listener:**
   - Open browser console
   - Look for Firestore listener errors
   - System should fall back to API polling

3. **Check network:**
   - Verify WebSocket connection to Firestore
   - Check for firewall/proxy issues

### Badge Count Wrong

1. **Refresh page:**
   - Sometimes count needs to sync
   - API fallback should update it

2. **Check unread count API:**
   ```bash
   GET /api/notifications/unread-count
   ```

3. **Verify notifications:**
   - Check Firestore for actual unread count
   - Compare with API response

## Success Indicators

✅ **System is working if:**
- Notifications can be created via API
- Notifications appear in UI within 1-2 seconds
- Badge count updates automatically
- Clicking notification marks it as read
- Different notification types work
- Real-time updates work
- Event handlers trigger notifications

❌ **System has issues if:**
- Notifications don't appear
- Badge count doesn't update
- Real-time updates don't work
- Event handlers don't trigger notifications
- API calls fail
- Firestore errors in console

