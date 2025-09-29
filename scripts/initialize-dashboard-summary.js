#!/usr/bin/env node

/**
 * Initialize Dashboard Summary Script
 * 
 * This script ensures the dashboard summary is properly initialized
 * and refreshed with current data from all collections.
 * 
 * Usage: node scripts/initialize-dashboard-summary.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuration
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
  JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;

if (!serviceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  console.error('Please set your Firebase service account key in your environment variables');
  process.exit(1);
}

try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = getFirestore();

async function initializeDashboardSummary() {
  console.log('🔄 Initializing dashboard summary...');
  
  try {
    // Calculate current counts from all collections
    console.log('📊 Calculating current statistics...');
    
    const [usersSnapshot, productsSnapshot, ordersSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('productCategories').get()
    ]);

    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('📈 Current collection counts:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Orders: ${orders.length}`);
    console.log(`  - Categories: ${categories.length}`);

    // Calculate metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = {
      // Basic counts
      totalUsers: users.length,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalCategories: categories.length,
      
      // Revenue calculations
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      todayRevenue: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= today;
      }).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      thisMonthRevenue: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= thisMonth;
      }).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      
      // Daily metrics
      newUsersToday: users.filter(u => {
        const userDate = new Date(u.createdAt);
        return userDate >= today;
      }).length,
      newOrdersToday: orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= today;
      }).length,
      newProductsThisWeek: products.filter(p => {
        const productDate = new Date(p.createdAt);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return productDate >= weekAgo;
      }).length,
      
      // Metadata
      lastUpdated: now.toISOString(),
      lastUpdatedBy: 'initialization_script',
      version: 1,
      creationDate: now.toISOString(),
      calculatedAt: now.toISOString()
    };

    console.log('📝 Dashboard Summary calculated:');
    console.log(`  - Total Users: ${summary.totalUsers}`);
    console.log(`  - Total Products: ${summary.totalProducts}`);
    console.log(`  - Active Products: ${summary.activeProducts}`);
    console.log(`  - Total Categories: ${summary.totalCategories}`);
    console.log(`  - Total Orders: ${summary.totalOrders}`);
    console.log(`  - Total Revenue: $${summary.totalRevenue.toFixed(2)}`);

    // Save to database
    console.log('💾 Saving summary to database...');
    const summaryRef = db.collection('dashboard-summary').doc('live-summary');
    await summaryRef.set(summary);

    console.log('✅ Dashboard summary initialized successfully!');
    console.log('🔄 The admin dashboard should now display current statistics.');
    
  } catch (error) {
    console.error('❌ Error initializing dashboard summary:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  initializeDashboardSummary()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDashboardSummary };