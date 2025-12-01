#!/usr/bin/env node

/**
 * Test Notification System Script
 * 
 * This script creates test notifications to verify the notification system is working.
 * 
 * Usage: node scripts/test-notifications.js [options]
 * Options:
 *   --user-id <id>     User ID to send notification to (default: current user)
 *   --type <type>      Notification type (default: system_announcement)
 *   --count <number>   Number of notifications to create (default: 1)
 *   --all-types        Create one notification of each type
 */

require('dotenv').config();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Note: This script requires TypeScript compilation
// For now, we'll use a workaround by importing the compiled version
// In production, compile TypeScript first: npm run build
const path = require('path');

// Try to use ts-node if available, otherwise expect compiled JS
let NotificationService;
try {
  // Try to load from compiled output
  NotificationService = require(path.join(__dirname, '../dist/services/NotificationService')).NotificationService;
} catch (e) {
  console.error('❌ NotificationService not found. Please compile TypeScript first: npm run build');
  console.error('   Or use the API endpoint: POST /api/test/notifications');
  process.exit(1);
}

const notificationTypes = [
  'order_created',
  'order_status_changed',
  'order_cancelled',
  'order_payment_received',
  'order_payment_failed',
  'customization_request_created',
  'customization_designer_assigned',
  'customization_design_completed',
  'customization_design_approved',
  'customization_design_rejected',
  'customization_pricing_created',
  'customization_payment_required',
  'customization_request_cancelled',
  'message_received',
  'review_received',
  'review_reply_received',
  'product_published',
  'product_updated',
  'user_welcome',
  'user_verified',
  'application_status_updated',
  'profile_updated',
  'system_announcement'
];

async function testNotifications() {
  try {
    console.log('🧪 Testing Notification System...\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
      userId: null,
      type: 'system_announcement',
      count: 1,
      allTypes: false
    };

    let i = 0;
    while (i < args.length) {
      if (args[i] === '--user-id' && args[i + 1]) {
        options.userId = args[i + 1];
        i += 2;
      } else if (args[i] === '--type' && args[i + 1]) {
        options.type = args[i + 1];
        i += 2;
      } else if (args[i] === '--count' && args[i + 1]) {
        options.count = parseInt(args[i + 1]);
        i += 2;
      } else if (args[i] === '--all-types') {
        options.allTypes = true;
        i++;
      } else {
        i++;
      }
    }

    // Initialize Firebase Admin
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;

    if (!serviceAccount) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
        console.error('❌ Firebase Admin SDK environment variables are required');
        process.exit(1);
      }

      try {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey.replace(/^["']|["']$/g, ''),
          }),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } catch (error) {
        if (error.code !== 'app/duplicate-app') {
          throw error;
        }
      }
    } else {
      try {
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (error) {
        if (error.code !== 'app/duplicate-app') {
          throw error;
        }
      }
    }

    const db = getFirestore();

    // Get user ID
    let userId = options.userId;
    if (!userId) {
      // Get first user from database
      const usersSnapshot = await db.collection('users').limit(1).get();
      if (usersSnapshot.empty) {
        console.error('❌ No users found in database. Please specify --user-id');
        process.exit(1);
      }
      userId = usersSnapshot.docs[0].id;
      console.log(`📌 Using user ID: ${userId} (first user in database)`);
    }

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error(`❌ User ${userId} not found`);
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log(`👤 User: ${userData.displayName || userData.email || userId}\n`);

    const notificationService = new NotificationService();
    const createdNotifications = [];

    // Create notifications
    if (options.allTypes) {
      console.log('📬 Creating one notification of each type...\n');
      for (const type of notificationTypes) {
        try {
          const notification = await notificationService.sendNotification(
            userId,
            type,
            {
              test: true,
              testType: type,
              relatedEntityId: `test-${Date.now()}`,
              relatedEntityType: 'test'
            }
          );
          createdNotifications.push({ type, id: notification.id });
          console.log(`✅ Created: ${type}`);
        } catch (error) {
          console.error(`❌ Failed to create ${type}:`, error.message);
        }
      }
    } else {
      console.log(`📬 Creating ${options.count} notification(s) of type: ${options.type}\n`);
      for (let i = 0; i < options.count; i++) {
        try {
          const notification = await notificationService.sendNotification(
            userId,
            options.type,
            {
              test: true,
              testNumber: i + 1,
              relatedEntityId: `test-${Date.now()}-${i}`,
              relatedEntityType: 'test'
            }
          );
          createdNotifications.push({ type: options.type, id: notification.id });
          console.log(`✅ Created notification ${i + 1}/${options.count}: ${notification.id}`);
        } catch (error) {
          console.error(`❌ Failed to create notification ${i + 1}:`, error.message);
        }
      }
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total created: ${createdNotifications.length}`);
    console.log(`   User ID: ${userId}`);
    
    if (createdNotifications.length > 0) {
      console.log(`\n✅ Test notifications created successfully!`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Check the notification bell icon in the UI`);
      console.log(`   2. Verify notifications appear in the dropdown`);
      console.log(`   3. Go to /notifications to see all notifications`);
      console.log(`   4. Test marking notifications as read`);
    } else {
      console.log(`\n⚠️  No notifications were created. Check errors above.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testNotifications();
}

module.exports = { testNotifications };

