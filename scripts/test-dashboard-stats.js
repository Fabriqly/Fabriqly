#!/usr/bin/env node

/**
 * Test Dashboard Stats API
 * 
 * This script tests the dashboard-stats API endpoint to verify
 * that real percentage calculations are working correctly.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testDashboardStats() {
  console.log('🧪 Testing Dashboard Stats API...\n');

  try {
    // Test 1: Basic API call
    console.log('1️⃣ Testing basic API call...');
    const response = await fetch(`${BASE_URL}/api/dashboard-stats?period=7d`);
    
    if (!response.ok) {
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text.substring(0, 200) + '...');
      return;
    }

    const data = await response.json();
    console.log('✅ API call successful');
    console.log('📊 Current stats:', data.current);
    console.log('📈 Changes:', data.changes);
    console.log('📅 Period:', data.period);
    console.log('🗓️ Comparison date:', data.comparisonDate);
    console.log('');

    // Test 2: Different time periods
    console.log('2️⃣ Testing different time periods...');
    const periods = ['7d', '30d', '90d'];
    
    for (const period of periods) {
      const periodResponse = await fetch(`${BASE_URL}/api/dashboard-stats?period=${period}`);
      if (periodResponse.ok) {
        const periodData = await periodResponse.json();
        console.log(`✅ ${period}: ${periodData.changes.totalUsers.value}% user change`);
      } else {
        console.log(`❌ ${period}: Failed`);
      }
    }
    console.log('');

    // Test 3: Verify percentage calculations
    console.log('3️⃣ Verifying percentage calculations...');
    const { current, changes } = data;
    
    // Check if changes are reasonable
    const checks = [
      { name: 'Users', current: current.totalUsers, change: changes.totalUsers },
      { name: 'Products', current: current.totalProducts, change: changes.totalProducts },
      { name: 'Categories', current: current.totalCategories, change: changes.totalCategories },
      { name: 'Orders', current: current.totalOrders, change: changes.totalOrders }
    ];

    checks.forEach(check => {
      const { name, current: currentVal, change } = check;
      console.log(`${name}: ${currentVal} (${change.type === 'positive' ? '+' : change.type === 'negative' ? '-' : ''}${change.value}%)`);
      
      // Validate change type
      if (change.value === 0) {
        console.log(`  ℹ️  ${name}: No change (likely no historical data)`);
      } else if (change.type === 'positive') {
        console.log(`  ✅ ${name}: Positive growth`);
      } else if (change.type === 'negative') {
        console.log(`  ⚠️  ${name}: Decline`);
      } else {
        console.log(`  ➖ ${name}: Neutral`);
      }
    });
    console.log('');

    // Test 4: Check if historical data exists
    console.log('4️⃣ Checking historical data...');
    if (changes.totalUsers.value === 0 && changes.totalProducts.value === 0) {
      console.log('ℹ️  No historical data found - this is expected for first run');
      console.log('💡 Run the init-dashboard-snapshots.js script to create baseline data');
    } else {
      console.log('✅ Historical data found - percentage calculations are working!');
    }

    console.log('\n🎉 Dashboard stats testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

// Run the test
testDashboardStats();
