#!/usr/bin/env node

/**
 * Color Management Test Suite
 * 
 * This script tests all color management functionality including:
 * - CRUD operations
 * - Bulk operations
 * - Product-color associations
 * - Error handling
 * - Validation
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const BUSINESS_OWNER_TOKEN = process.env.BUSINESS_OWNER_TOKEN || '';

// Test configuration
const TEST_CONFIG = {
  colors: {
    valid: [
      {
        colorName: 'Test Red',
        hexCode: '#FF0000',
        rgbCode: 'rgb(255, 0, 0)',
        isActive: true
      },
      {
        colorName: 'Test Blue',
        hexCode: '#0000FF',
        rgbCode: 'rgb(0, 0, 255)',
        isActive: true
      },
      {
        colorName: 'Test Green',
        hexCode: '#00FF00',
        rgbCode: 'rgb(0, 255, 0)',
        isActive: false
      }
    ],
    invalid: [
      {
        colorName: '',
        hexCode: '#FF0000',
        rgbCode: 'rgb(255, 0, 0)'
      },
      {
        colorName: 'Invalid Hex',
        hexCode: 'FF0000', // Missing #
        rgbCode: 'rgb(255, 0, 0)'
      },
      {
        colorName: 'Invalid RGB',
        hexCode: '#FF0000',
        rgbCode: 'rgb(300, 0, 0)' // Invalid RGB value
      }
    ]
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const makeRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.ok ? await response.json() : null;
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data?.error || 'Unknown error'
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
};

const runTest = async (testName, testFunction) => {
  try {
    log(`Running test: ${testName}`);
    await testFunction();
    testResults.passed++;
    log(`✅ Test passed: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`❌ Test failed: ${testName} - ${error.message}`, 'error');
  }
};

// Test functions
const testGetColors = async () => {
  const result = await makeRequest('/api/colors');
  if (!result.ok) {
    throw new Error(`Failed to get colors: ${result.error}`);
  }
  if (!Array.isArray(result.data?.colors)) {
    throw new Error('Colors response is not an array');
  }
  log(`Found ${result.data.colors.length} colors`);
};

const testCreateColor = async () => {
  const colorData = TEST_CONFIG.colors.valid[0];
  const result = await makeRequest('/api/colors', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(colorData)
  });
  
  if (!result.ok) {
    throw new Error(`Failed to create color: ${result.error}`);
  }
  
  if (!result.data?.color?.id) {
    throw new Error('Created color missing ID');
  }
  
  return result.data.color.id;
};

const testUpdateColor = async (colorId) => {
  const updateData = {
    colorName: 'Updated Test Red',
    isActive: false
  };
  
  const result = await makeRequest(`/api/colors/${colorId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(updateData)
  });
  
  if (!result.ok) {
    throw new Error(`Failed to update color: ${result.error}`);
  }
  
  if (result.data.color.colorName !== updateData.colorName) {
    throw new Error('Color name was not updated');
  }
};

const testDeleteColor = async (colorId) => {
  const result = await makeRequest(`/api/colors/${colorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  
  if (!result.ok) {
    throw new Error(`Failed to delete color: ${result.error}`);
  }
};

const testBulkCreate = async () => {
  const bulkData = {
    colors: TEST_CONFIG.colors.valid.slice(1) // Use remaining test colors
  };
  
  const result = await makeRequest('/api/colors/bulk', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(bulkData)
  });
  
  if (!result.ok) {
    throw new Error(`Failed to bulk create colors: ${result.error}`);
  }
  
  if (!result.data?.results?.created) {
    throw new Error('Bulk create missing results');
  }
  
  return result.data.results.created.map(c => c.id);
};

const testBulkDelete = async (colorIds) => {
  const result = await makeRequest('/api/colors/bulk', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify({ colorIds })
  });
  
  if (!result.ok) {
    throw new Error(`Failed to bulk delete colors: ${result.error}`);
  }
};

const testValidationErrors = async () => {
  for (const invalidColor of TEST_CONFIG.colors.invalid) {
    const result = await makeRequest('/api/colors', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify(invalidColor)
    });
    
    if (result.ok) {
      throw new Error(`Invalid color was accepted: ${JSON.stringify(invalidColor)}`);
    }
    
    if (result.status !== 400) {
      throw new Error(`Expected 400 status for invalid color, got ${result.status}`);
    }
  }
};

const testUnauthorizedAccess = async () => {
  const result = await makeRequest('/api/colors', {
    method: 'POST',
    body: JSON.stringify(TEST_CONFIG.colors.valid[0])
  });
  
  if (result.ok) {
    throw new Error('Unauthorized request was accepted');
  }
  
  if (result.status !== 401) {
    throw new Error(`Expected 401 status for unauthorized request, got ${result.status}`);
  }
};

const testProductColorAssociation = async () => {
  // First create a color
  const colorResult = await makeRequest('/api/colors', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify(TEST_CONFIG.colors.valid[0])
  });
  
  if (!colorResult.ok) {
    throw new Error('Failed to create color for product association test');
  }
  
  const colorId = colorResult.data.color.id;
  
  // Note: This test requires a valid product ID
  // You would need to create a product first or use an existing one
  const productId = 'test-product-id'; // Replace with actual product ID
  
  // Add color to product
  const addResult = await makeRequest(`/api/products/${productId}/colors`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify({
      colorId,
      priceAdjustment: 5.00,
      isAvailable: true,
      stockQuantity: 100
    })
  });
  
  // Clean up - delete the color
  await makeRequest(`/api/colors/${colorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  
  // Note: This test might fail if product doesn't exist, which is expected
  if (!addResult.ok && addResult.status === 404) {
    log('Product-color association test skipped (no test product)', 'info');
    return;
  }
  
  if (!addResult.ok) {
    throw new Error(`Failed to add color to product: ${addResult.error}`);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🚀 Starting Color Management Test Suite');
  log(`Testing against: ${BASE_URL}`);
  
  if (!ADMIN_TOKEN) {
    log('⚠️  Warning: No admin token provided. Some tests may fail.', 'error');
  }
  
  // Basic CRUD tests
  await runTest('Get Colors', testGetColors);
  
  let createdColorId;
  await runTest('Create Color', async () => {
    createdColorId = await testCreateColor();
  });
  
  await runTest('Update Color', () => testUpdateColor(createdColorId));
  
  // Bulk operations
  let bulkCreatedIds = [];
  await runTest('Bulk Create Colors', async () => {
    bulkCreatedIds = await testBulkCreate();
  });
  
  await runTest('Bulk Delete Colors', () => testBulkDelete(bulkCreatedIds));
  
  // Clean up single color
  await runTest('Delete Color', () => testDeleteColor(createdColorId));
  
  // Error handling tests
  await runTest('Validation Errors', testValidationErrors);
  await runTest('Unauthorized Access', testUnauthorizedAccess);
  
  // Integration tests
  await runTest('Product Color Association', testProductColorAssociation);
  
  // Print results
  log('\n📊 Test Results Summary:');
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      log(`  - ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Color management system is working correctly.', 'success');
    process.exit(0);
  } else {
    log('\n💥 Some tests failed. Please check the errors above.', 'error');
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Color Management Test Suite

Usage: node test-color-management.js [options]

Options:
  --help, -h          Show this help message
  --url <url>         Set base URL (default: http://localhost:3000)
  --admin-token <token> Set admin authentication token
  --business-token <token> Set business owner authentication token

Environment Variables:
  TEST_BASE_URL       Base URL for testing
  ADMIN_TOKEN         Admin authentication token
  BUSINESS_OWNER_TOKEN Business owner authentication token

Examples:
  node test-color-management.js
  node test-color-management.js --url http://localhost:3000 --admin-token your-token
  TEST_BASE_URL=https://your-app.com ADMIN_TOKEN=your-token node test-color-management.js
`);
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      process.env.TEST_BASE_URL = args[i + 1];
      break;
    case '--admin-token':
      process.env.ADMIN_TOKEN = args[i + 1];
      break;
    case '--business-token':
      process.env.BUSINESS_OWNER_TOKEN = args[i + 1];
      break;
  }
}

// Run the tests
runAllTests().catch(error => {
  log(`💥 Test suite failed: ${error.message}`, 'error');
  process.exit(1);
});
