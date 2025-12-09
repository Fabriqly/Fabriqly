# Firestore Security Rules Setup

## Overview

This document explains how to set up and deploy Firestore security rules for the Fabriqly application. The rules ensure that users can only access their own data while allowing real-time updates for messages and notifications.

## Files Created

1. **`firestore.rules`** - Main security rules file
2. **`firebase.json`** - Firebase configuration file
3. **`firestore.indexes.json`** - Required indexes for queries
4. **`storage.rules`** - Firebase Storage security rules

## Key Security Rules

### Messages Collection
- Users can read messages where they are sender or receiver
- Users can create messages where they are the sender
- Users can update messages in conversations they're part of

### Notifications Collection
- Users can read their own notifications
- Only admins can create notifications (system-generated)
- Users can update/delete their own notifications

### Conversations Collection
- Users can read/write conversations they are participants in

## Deployment Instructions

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Use existing `firestore.rules` file
   - Use existing `firestore.indexes.json` file

4. **Deploy Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Deploy Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

6. **Deploy Storage Rules**:
   ```bash
   firebase deploy --only storage
   ```

### Option 2: Using Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` and paste into the editor
5. Click **Publish**
6. Navigate to **Storage** → **Rules** tab
7. Copy the contents of `storage.rules` and paste into the editor
8. Click **Publish**

### Option 3: Using Firebase Console for Indexes

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Add Index**
3. Create the following indexes manually:

**Index 1: Messages by conversationId and createdAt**
- Collection: `messages`
- Fields:
  - `conversationId` (Ascending)
  - `createdAt` (Ascending)

**Index 2: Messages by receiverId, isRead, and createdAt**
- Collection: `messages`
- Fields:
  - `receiverId` (Ascending)
  - `isRead` (Ascending)
  - `createdAt` (Descending)

**Index 3: Notifications by userId, isRead, and createdAt**
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `isRead` (Ascending)
  - `createdAt` (Descending)

**Index 4: Notifications by userId, type, and createdAt**
- Collection: `notifications`
- Fields:
  - `userId` (Ascending)
  - `type` (Ascending)
  - `createdAt` (Descending)

**Index 5: Conversations by participants and lastMessageAt**
- Collection: `conversations`
- Fields:
  - `participants` (Array contains)
  - `lastMessageAt` (Descending)

## Testing Rules

After deploying, test the rules to ensure they work correctly:

1. **Test Messages Access**:
   - Try reading messages in a conversation you're part of
   - Try creating a message as the sender
   - Verify you cannot read messages from other conversations

2. **Test Notifications Access**:
   - Try reading your own notifications
   - Verify you cannot read other users' notifications
   - Try marking your notifications as read

3. **Test Real-time Listeners**:
   - Open the chat component
   - Verify real-time updates work
   - Check that notifications update in real-time

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause**: Rules not deployed or incorrect rules

**Solution**:
1. Verify rules are deployed: `firebase deploy --only firestore:rules`
2. Check that user is authenticated
3. Verify the user ID matches the document's userId field
4. Check browser console for specific permission errors

### Error: "The query requires an index"

**Cause**: Required Firestore indexes not created

**Solution**:
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Or create indexes manually in Firebase Console
3. Wait for indexes to build (can take a few minutes)

### Error: "Permission denied" on real-time listeners

**Cause**: Rules don't allow read access for the query

**Solution**:
1. Check that the query matches the rules
2. Verify user is authenticated
3. Ensure the user is a participant in conversations they're querying
4. Check that userId matches for notifications

## Security Best Practices

1. **Always authenticate users** before allowing access
2. **Validate user ownership** of documents
3. **Use helper functions** to avoid code duplication
4. **Test rules thoroughly** before deploying to production
5. **Monitor Firebase Console** for rule violations
6. **Keep rules updated** as new features are added

## Next Steps

After deploying rules:
1. Test all real-time features (messages, notifications)
2. Verify users can only access their own data
3. Monitor Firebase Console for any permission errors
4. Update rules as needed when adding new features


