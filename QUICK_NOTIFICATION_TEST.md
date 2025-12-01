# Quick Notification System Test

## Fastest Way to Test (Browser Console)

### Step 1: Login as Admin
1. Go to `http://localhost:3000`
2. Login with an admin account

### Step 2: Open Browser Console
Press `F12` or right-click → Inspect → Console

### Step 3: Run Test Script
Copy and paste this into the console:

```javascript
// Quick notification test
async function testNotifications() {
  console.log('🧪 Testing notifications...');
  
  // Create test notification
  const res = await fetch('/api/test/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'system_announcement', count: 1 })
  });
  
  const data = await res.json();
  console.log('✅ Result:', data);
  
  // Wait a moment
  await new Promise(r => setTimeout(r, 1000));
  
  // Check unread count
  const countRes = await fetch('/api/notifications/unread-count');
  const countData = await countRes.json();
  console.log('📊 Unread count:', countData.data?.count);
  
  console.log('✅ Test complete! Check the notification bell icon (🔔)');
}

testNotifications();
```

### Step 4: Verify
1. **Look at the notification bell** in the header
2. **Badge should show "1"** (or increased count)
3. **Click the bell** - notification should appear
4. **Click the notification** - should mark as read

## What to Check

✅ **Working correctly if:**
- Badge appears on bell icon
- Badge count is correct
- Notification appears in dropdown
- Clicking marks it as read
- Badge count decreases after reading

❌ **Has issues if:**
- No badge appears
- Badge count is wrong
- Notification doesn't appear
- Clicking doesn't mark as read

## Test Different Types

```javascript
// Test order notification
fetch('/api/test/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'order_created', count: 1 })
});

// Test warning notification
fetch('/api/test/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'order_cancelled', count: 1 })
});

// Test error notification
fetch('/api/test/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'order_payment_failed', count: 1 })
});
```

## Test Real-Time Updates

1. **Keep page open** (don't refresh)
2. **Run test script again** in console
3. **Watch the bell icon** - badge should update automatically
4. **No page refresh needed!**

## Troubleshooting

**No badge appears:**
- Check browser console for errors
- Verify you're logged in as admin
- Check Firestore security rules

**Badge count wrong:**
- Refresh page
- Check `/api/notifications/unread-count` response

**Real-time not working:**
- Check Firebase Auth is synced
- System should fall back to API polling

For detailed testing, see: `docs/NOTIFICATION_TESTING_GUIDE.md`

