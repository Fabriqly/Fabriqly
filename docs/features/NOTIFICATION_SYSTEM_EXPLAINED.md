# Notification System - How It Works

## Overview

The Fabriqly notification system is an **event-driven, real-time notification system** that sends in-app notifications to users when important events occur in the system. It uses Firebase Firestore for storage and real-time updates.

## Architecture

```
┌─────────────────┐
│  Event Bus      │  ← System events (order created, user verified, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Handlers  │  ← Listen to events and trigger notifications
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Notification     │  ← Creates notification using templates
│Service          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Firestore       │  ← Stores notification in 'notifications' collection
│ (notifications) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Real-time       │  ← UI components listen for changes
│ Listeners       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Components   │  ← NotificationBell, NotificationDropdown
│                 │
└─────────────────┘
```

## How It Works - Step by Step

### 1. **Event Occurs**
When something happens in the system (e.g., order created, user verified), an event is emitted:

```typescript
// Example: When an order is created
eventBus.emit('order.created', {
  orderId: 'order-123',
  customerId: 'user-456',
  totalAmount: 1000
});
```

### 2. **Event Handler Listens**
The `NotificationEventHandlers` class listens to these events:

```typescript
// In src/events/EventHandlers.ts
eventBus.on('order.created', async (event) => {
  await notificationService.sendNotification(
    event.data.customerId,  // Who to notify
    'order_created',         // Notification type
    {                        // Data for template
      orderId: event.data.orderId,
      totalAmount: event.data.totalAmount
    }
  );
});
```

### 3. **Template Generates Content**
The `NotificationTemplates` class generates the notification content:

```typescript
// In src/services/NotificationTemplates.ts
order_created: (data) => ({
  title: 'Order Placed',
  message: `Your order #${data.orderId} has been placed successfully.`,
  category: 'success',
  priority: 'medium',
  actionUrl: `/orders/${data.orderId}`,
  actionLabel: 'View Order'
})
```

### 4. **Notification Created**
The `NotificationService` creates the notification in Firestore:

```typescript
// Checks user preferences
// Creates notification document in 'notifications' collection
// Sets isRead: false, createdAt: now
```

### 5. **Real-Time Update**
Firestore listeners in the UI components detect the new notification:

```typescript
// In NotificationBell.tsx
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', session.user.id),
  where('isRead', '==', false)
);

onSnapshot(q, (snapshot) => {
  setUnreadCount(snapshot.size); // Updates badge count
});
```

### 6. **User Sees Notification**
- **Notification Bell** shows unread count badge
- **Notification Dropdown** shows recent notifications
- User can click to view, mark as read, or delete

## Components

### Backend Components

#### 1. **NotificationService** (`src/services/NotificationService.ts`)
- Main service for creating and managing notifications
- Methods:
  - `createNotification()` - Create single notification
  - `sendNotification()` - Send using template
  - `getUserNotifications()` - Get user's notifications
  - `markAsRead()` - Mark notification as read
  - `getUnreadCount()` - Get unread count

#### 2. **NotificationTemplates** (`src/services/NotificationTemplates.ts`)
- Defines templates for each notification type
- Generates title, message, category, priority, action URLs
- Supports 20+ notification types

#### 3. **NotificationRepository** (`src/repositories/NotificationRepository.ts`)
- Database operations for notifications
- Queries Firestore collection

#### 4. **NotificationEventHandlers** (`src/events/EventHandlers.ts`)
- Listens to system events
- Triggers appropriate notifications
- Handles events like:
  - User created/verified
  - Order created/updated/cancelled
  - Product published/updated
  - Customization requests
  - Messages received
  - Reviews received

### Frontend Components

#### 1. **NotificationBell** (`src/components/notifications/NotificationBell.tsx`)
- Bell icon in header
- Shows unread count badge
- Opens notification dropdown
- Real-time updates via Firestore listener

#### 2. **NotificationDropdown** (`src/components/notifications/NotificationDropdown.tsx`)
- Dropdown menu with recent notifications
- Shows last 10 unread notifications
- Real-time updates
- Actions: mark as read, delete, view all

#### 3. **NotificationItem** (`src/components/notifications/NotificationItem.tsx`)
- Individual notification display
- Shows title, message, timestamp
- Color-coded by category
- Clickable action buttons

#### 4. **NotificationCenter** (`src/components/notifications/NotificationCenter.tsx`)
- Full notification page (`/notifications`)
- Shows all notifications with filters
- Pagination support

## Notification Types

The system supports 20+ notification types:

### Order Notifications
- `order_created` - Order placed successfully
- `order_status_changed` - Order status updated
- `order_cancelled` - Order cancelled
- `order_payment_received` - Payment received
- `order_payment_failed` - Payment failed

### Customization Notifications
- `customization_request_created` - New request available
- `customization_designer_assigned` - Designer assigned
- `customization_design_completed` - Design ready for review
- `customization_design_approved` - Design approved
- `customization_design_rejected` - Design needs revision
- `customization_pricing_created` - Pricing available
- `customization_payment_required` - Payment needed
- `customization_request_cancelled` - Request cancelled

### User Notifications
- `user_welcome` - Welcome message
- `user_verified` - Account verified
- `application_status_updated` - Application status changed
- `profile_updated` - Profile updated

### Product Notifications
- `product_published` - Product published
- `product_updated` - Product updated

### Communication Notifications
- `message_received` - New message
- `review_received` - New review
- `review_reply_received` - Reply to review

### System Notifications
- `system_announcement` - System-wide announcements

## Notification Properties

Each notification has:

```typescript
{
  id: string                    // Auto-generated
  userId: string                // Who receives it
  type: NotificationType        // Type (e.g., 'order_created')
  category: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string                 // Notification title
  message: string               // Notification message
  actionUrl?: string            // Link to related page
  actionLabel?: string          // Button text
  isRead: boolean               // Read status
  readAt?: Date                 // When read
  metadata?: object              // Additional data
  relatedEntityId?: string       // Related entity ID
  relatedEntityType?: string     // Related entity type
  createdAt: Date               // When created
  updatedAt: Date               // Last updated
}
```

## Real-Time Updates

The system uses **Firebase Firestore real-time listeners**:

1. **NotificationBell** listens for unread count changes
2. **NotificationDropdown** listens for recent notifications
3. Updates happen instantly when new notifications are created
4. Falls back to API calls if Firestore permissions fail

## User Preferences

Users can control notifications via preferences:

```typescript
user.profile.preferences.notifications = {
  email: true,    // Email notifications
  sms: false,      // SMS notifications
  push: true       // In-app notifications (default: true)
}
```

If `push: false`, notifications won't be created.

## API Endpoints

### Get Notifications
```
GET /api/notifications?limit=10&isRead=false
```

### Get Unread Count
```
GET /api/notifications/unread-count
```

### Mark as Read
```
PATCH /api/notifications/[id]
Body: { isRead: true }
```

### Mark All as Read
```
POST /api/notifications/read-all
```

### Delete Notification
```
DELETE /api/notifications/[id]
```

## Flow Example: Order Created

1. **User places order** → OrderService creates order
2. **Event emitted** → `eventBus.emit('order.created', {...})`
3. **Handler triggered** → NotificationEventHandlers listens
4. **Template used** → NotificationTemplates.generate('order_created', data)
5. **Notification created** → Saved to Firestore
6. **Real-time update** → NotificationBell listener fires
7. **UI updates** → Badge count increases, dropdown shows notification
8. **User clicks** → Opens order page via actionUrl

## Best Practices

1. **Use event bus** - Don't create notifications directly, use events
2. **Check preferences** - Service automatically checks user preferences
3. **Use templates** - Don't hardcode notification content
4. **Set priorities** - Use appropriate priority levels
5. **Include action URLs** - Make notifications actionable
6. **Clean up old** - System can cleanup notifications older than 90 days

## Testing Notifications

### Create Test Notification
```typescript
// In API route or service
await notificationService.sendNotification(
  userId,
  'order_created',
  {
    orderId: 'test-123',
    totalAmount: 1000
  }
);
```

### Check in UI
1. Look for bell icon in header
2. Check unread count badge
3. Click bell to see dropdown
4. Go to `/notifications` for full list

## Troubleshooting

### Notifications not showing
- Check Firestore security rules allow read access
- Verify user preferences (push notifications enabled)
- Check browser console for errors
- Verify Firebase Auth is synced

### Real-time not working
- Check Firestore listener is set up
- Verify Firebase Auth state
- Check for permission errors
- System falls back to API polling if needed

### Notifications not created
- Check event handlers are initialized
- Verify event is being emitted
- Check user preferences
- Look for errors in server logs

