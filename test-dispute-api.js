// Test script for Dispute API endpoints
// Run with: node test-dispute-api.js

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual IDs from your database
  testOrderId: null, // Set this to a real order ID for testing
  testCustomizationRequestId: null, // Set this to a real customization request ID
  testUserId: null, // Set this to a real user ID
  testAdminId: null, // Set this to an admin user ID
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    if (response.ok) {
      console.log('✅ Success:', JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status };
    } else {
      console.log('❌ Error:', response.status, JSON.stringify(data, null, 2));
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 1: Check Eligibility
async function testCheckEligibility() {
  console.log('\n🧪 TEST 1: Check Dispute Eligibility');
  console.log('='.repeat(50));
  
  if (!TEST_CONFIG.testOrderId && !TEST_CONFIG.testCustomizationRequestId) {
    console.log('⚠️  Skipping: No test order or customization request ID set');
    return;
  }

  const result = await apiRequest('/api/disputes/check-eligibility', {
    method: 'POST',
    body: JSON.stringify({
      orderId: TEST_CONFIG.testOrderId,
      customizationRequestId: TEST_CONFIG.testCustomizationRequestId,
    }),
  });

  return result;
}

// Test 2: Get Disputes List
async function testGetDisputes() {
  console.log('\n🧪 TEST 2: Get Disputes List');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/disputes', {
    method: 'GET',
  });

  return result;
}

// Test 3: Get Disputes with Filters
async function testGetDisputesWithFilters() {
  console.log('\n🧪 TEST 3: Get Disputes with Filters');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/disputes?stage=negotiation&status=open', {
    method: 'GET',
  });

  return result;
}

// Test 4: Get Pending Admin Disputes
async function testGetPendingAdminDisputes() {
  console.log('\n🧪 TEST 4: Get Pending Admin Disputes');
  console.log('='.repeat(50));

  const result = await apiRequest('/api/disputes/pending-admin', {
    method: 'GET',
  });

  return result;
}

// Test 5: File a Dispute (requires FormData - simplified test)
async function testFileDispute() {
  console.log('\n🧪 TEST 5: File a Dispute');
  console.log('='.repeat(50));
  console.log('⚠️  Note: This test requires FormData and authentication');
  console.log('⚠️  Skipping actual file upload - test structure only');
  
  // This would require actual FormData and authentication
  // For now, just show the structure
  console.log('📝 To file a dispute, POST to /api/disputes with FormData containing:');
  console.log('   - orderId or customizationRequestId');
  console.log('   - category (e.g., "shipping_damaged")');
  console.log('   - description');
  console.log('   - evidenceImages[] (files)');
  console.log('   - evidenceVideo (optional file)');
  
  return { success: true, skipped: true };
}

// Test 6: Get Dispute Details
async function testGetDisputeDetails(disputeId) {
  console.log('\n🧪 TEST 6: Get Dispute Details');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}`, {
    method: 'GET',
  });

  return result;
}

// Test 7: Accept Dispute
async function testAcceptDispute(disputeId) {
  console.log('\n🧪 TEST 7: Accept Dispute');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}/accept`, {
    method: 'POST',
  });

  return result;
}

// Test 8: Cancel Dispute
async function testCancelDispute(disputeId) {
  console.log('\n🧪 TEST 8: Cancel Dispute');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}/cancel`, {
    method: 'POST',
  });

  return result;
}

// Test 9: Offer Partial Refund
async function testOfferPartialRefund(disputeId) {
  console.log('\n🧪 TEST 9: Offer Partial Refund');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}/partial-refund`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 200,
      percentage: 20,
    }),
  });

  return result;
}

// Test 10: Accept Partial Refund Offer
async function testAcceptPartialRefund(disputeId) {
  console.log('\n🧪 TEST 10: Accept Partial Refund Offer');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}/partial-refund`, {
    method: 'PUT',
    body: JSON.stringify({
      action: 'accept',
    }),
  });

  return result;
}

// Test 11: Admin Resolve Dispute
async function testAdminResolveDispute(disputeId) {
  console.log('\n🧪 TEST 11: Admin Resolve Dispute');
  console.log('='.repeat(50));

  if (!disputeId) {
    console.log('⚠️  Skipping: No dispute ID provided');
    return;
  }

  const result = await apiRequest(`/api/disputes/${disputeId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({
      outcome: 'refunded',
      reason: 'Test resolution - customer was right',
      issueStrike: true,
      adminNotes: 'Test admin resolution',
    }),
  });

  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Dispute API Tests');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`\n⚠️  Note: Most tests require authentication`);
  console.log(`⚠️  Note: Some tests require actual data IDs from your database`);
  console.log('='.repeat(50));

  const results = [];

  // Run basic tests that don't require authentication
  results.push(await testGetDisputes());
  results.push(await testGetDisputesWithFilters());
  results.push(await testGetPendingAdminDisputes());
  results.push(await testCheckEligibility());
  results.push(await testFileDispute());

  // If you have a dispute ID, test these
  const testDisputeId = process.env.TEST_DISPUTE_ID;
  if (testDisputeId) {
    results.push(await testGetDisputeDetails(testDisputeId));
    // Uncomment to test actions (will modify data):
    // results.push(await testAcceptDispute(testDisputeId));
    // results.push(await testCancelDispute(testDisputeId));
    // results.push(await testOfferPartialRefund(testDisputeId));
    // results.push(await testAcceptPartialRefund(testDisputeId));
    // results.push(await testAdminResolveDispute(testDisputeId));
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  const passed = results.filter(r => r?.success).length;
  const failed = results.filter(r => r && !r.success).length;
  const skipped = results.filter(r => r?.skipped).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests completed!');
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});






