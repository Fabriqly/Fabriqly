#!/usr/bin/env node

/**
 * Create Sample Dispute
 * 
 * This script creates a sample dispute for admin testing purposes.
 * It bypasses normal validation and creates a dispute directly in the database.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

async function createSampleDispute() {
  try {
    console.log('🎯 Creating Sample Dispute for Admin Testing');
    console.log('==========================================\n');

    // Get or create sample customer
    let customerId;
    const customersSnapshot = await db.collection('users').where('role', '==', 'customer').limit(1).get();
    
    if (customersSnapshot.empty) {
      console.log('👤 Creating sample customer...');
      const customerRef = await db.collection('users').add({
        email: 'sample.customer@fabriqly.com',
        name: 'Sample Customer',
        displayName: 'Sample Customer',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      customerId = customerRef.id;
      console.log(`✅ Created customer: ${customerId}`);
    } else {
      customerId = customersSnapshot.docs[0].id;
      console.log(`✅ Using existing customer: ${customerId}`);
    }

    // Get or create sample business owner (for shipping dispute)
    let businessOwnerId;
    const businessOwnersSnapshot = await db.collection('users').where('role', '==', 'business_owner').limit(1).get();
    
    if (businessOwnersSnapshot.empty) {
      console.log('👤 Creating sample business owner...');
      const businessOwnerRef = await db.collection('users').add({
        email: 'sample.business@fabriqly.com',
        name: 'Sample Business Owner',
        displayName: 'Sample Business Owner',
        role: 'business_owner',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      businessOwnerId = businessOwnerRef.id;
      console.log(`✅ Created business owner: ${businessOwnerId}`);
    } else {
      businessOwnerId = businessOwnersSnapshot.docs[0].id;
      console.log(`✅ Using existing business owner: ${businessOwnerId}`);
    }

    // Create dispute conversation
    console.log('\n💬 Creating dispute conversation...');
    const conversationRef = await db.collection('conversations').add({
      participants: [customerId, businessOwnerId],
      type: 'dispute',
      lastMessageAt: Timestamp.now(),
      unreadCount: {
        [customerId]: 0,
        [businessOwnerId]: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    const conversationId = conversationRef.id;
    console.log(`✅ Created conversation: ${conversationId}`);

    // Set deadlines
    const now = Timestamp.now();
    const negotiationDeadline = new Date(now.toMillis() + (48 * 60 * 60 * 1000)); // 48 hours
    const deadline = new Date(now.toMillis() + (5 * 24 * 60 * 60 * 1000)); // 5 days

    // Create sample evidence
    const evidenceImages = [
      {
        url: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Evidence+Image+1',
        path: 'disputes/sample/evidence1.jpg',
        fileName: 'evidence1.jpg',
        fileSize: 150000,
        contentType: 'image/jpeg',
        uploadedAt: now
      },
      {
        url: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Evidence+Image+2',
        path: 'disputes/sample/evidence2.jpg',
        fileName: 'evidence2.jpg',
        fileSize: 180000,
        contentType: 'image/jpeg',
        uploadedAt: now
      }
    ];

    // Create dispute
    console.log('\n📋 Creating dispute...');
    const disputeData = {
      filedBy: customerId,
      accusedParty: businessOwnerId,
      stage: 'admin_review',
      category: 'shipping_not_received',
      description: 'Sample dispute for testing admin functionality. This is a shipping_not_received dispute filed by a customer against a business owner. The dispute is currently in admin_review stage and has open status.',
      evidenceImages: evidenceImages,
      status: 'open',
      conversationId: conversationId,
      negotiationDeadline: Timestamp.fromDate(negotiationDeadline),
      deadline: Timestamp.fromDate(deadline),
      createdAt: now,
      updatedAt: now,
      adminNotes: 'This is a sample dispute created for admin testing purposes.'
    };

    const disputeRef = await db.collection('disputes').add(disputeData);
    const disputeId = disputeRef.id;

    console.log(`✅ Created dispute: ${disputeId}`);
    console.log('\n📊 Dispute Details:');
    console.log(`   ID: ${disputeId}`);
    console.log(`   Category: ${disputeData.category}`);
    console.log(`   Stage: ${disputeData.stage}`);
    console.log(`   Status: ${disputeData.status}`);
    console.log(`   Filed By: ${customerId}`);
    console.log(`   Accused Party: ${businessOwnerId}`);
    console.log(`   Conversation ID: ${conversationId}`);

    console.log('\n🎉 Sample dispute created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit http://localhost:3000/dashboard/admin/disputes');
    console.log('2. You should see the sample dispute in the admin panel');
    console.log('3. You can test the resolution workflow');
    console.log(`4. View dispute details at: http://localhost:3000/disputes/${disputeId}`);

    return {
      success: true,
      disputeId,
      conversationId,
      customerId,
      businessOwnerId
    };

  } catch (error) {
    console.error('\n❌ Error creating sample dispute:', error);
    throw error;
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Sample Dispute Creation Script

Usage: node scripts/create-sample-dispute.js [options]

Options:
  --help, -h          Show this help message

Description:
  This script creates a sample dispute for admin testing purposes.
  It creates:
  - A sample customer (if none exists)
  - A sample business owner (if none exists)
  - A dispute conversation
  - A dispute in 'admin_review' stage

Prerequisites:
  - .env.local file with Firebase admin credentials
  - Firebase project properly configured

Examples:
  node scripts/create-sample-dispute.js
  node scripts/create-sample-dispute.js --help
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  createSampleDispute()
    .then((result) => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createSampleDispute };

