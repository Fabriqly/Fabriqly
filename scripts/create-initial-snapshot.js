#!/usr/bin/env node

/**
 * Create Initial Dashboard Snapshot Script
 * 
 * This script creates a snapshot of today's metrics so that
 * percentage changes can be calculated starting tomorrow.
 * 
 * Usage: node scripts/create-initial-snapshot.js
 */

console.log('🔧 Creating initial dashboard snapshot...');

// Import Firebase Admin (assumes it's initialized in Node.js environment)
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables
require('dotenv').config();

async function createInitialSnapshot() {
  try {
    console.log('📊 Collecting current metrics...');
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;

    if (!serviceAccount) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
      process.exit(1);
    }

    try {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (error) {
      if (error.code !== 'app/duplicate-app') {
        throw error;
      }
    }

    const db = getFirestore();
    
    // Get current counts from collections
    const [usersSnapshot, productsSnapshot, ordersSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('productCategories').get()
    ]);

    const users = usersSnapshot.docs.length;
    const products = productsSnapshot.docs.length;
    const orders = ordersSnapshot.docs.length;
    const categories = categoriesSnapshot.docs.length;
    
    // Calculate active products
    const activeProducts = productsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'active';
    }).length;
    
    // Calculate pending orders
    const pendingOrders = ordersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'pending';
    }).length;
    
    // Calculate total revenue
    const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.totalAmount || 0);
    }, 0);

    console.log('📈 Current metrics:');
    console.log(`  - Users: ${users}`);
    console.log(`  - Products: ${products}`);
    console.log(`  - Active Products: ${activeProducts}`);
    console.log(`  - Categories: ${categories}`);
    console.log(`  - Orders: ${orders}`);
    console.log(`  - Pending Orders: ${pendingOrders}`);
    console.log(`  - Revenue: $${totalRevenue.toFixed(2)}`);

    // Create snapshot data
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const snapshotData = {
      date: today,
      totalUsers: users,
      totalProducts: products,
      totalCategories: categories,
      totalOrders: orders,
      totalRevenue: totalRevenue,
      activeProducts: activeProducts,
      pendingOrders: pendingOrders,
      createdAt: new Date()
    };

    console.log('💾 Saving snapshot to database...');
    
    // Check if snapshot already exists for today
    const existingSnapshots = await db.collection('dashboardSnapshots')
      .where('date', '==', today)
      .get();

    if (existingSnapshots.empty) {
      await db.collection('dashboardSnapshots').add(snapshotData);
      console.log('✅ Initial snapshot created successfully!');
    } else {
      // Update existing snapshot
      const existingSnapshot = existingSnapshots.docs[0];
      await existingSnapshot.ref.update(snapshotData);
      console.log('✅ Existing snapshot updated successfully!');
    }

    console.log('🎯 Tomorrow when you refresh the dashboard, you should see percentage changes!');
    console.log('📅 Snapshot date:', today);
    
  } catch (error) {
    console.error('❌ Error creating snapshot:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createInitialSnapshot()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createInitialSnapshot };
