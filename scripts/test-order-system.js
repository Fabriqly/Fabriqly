#!/usr/bin/env node

/**
 * Order System Testing Script
 * 
 * This script tests the complete order system including:
 * - API endpoints
 * - Cart functionality
 * - Checkout process
 * - Order management
 * - Status tracking
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: config.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

function logTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error });
    console.log(`❌ ${testName}: ${error}`);
  }
}

function logSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('='.repeat(50));
}

// Test functions
async function testApiEndpoint(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const url = `${config.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await makeRequest(url, options);
    const passed = response.statusCode === expectedStatus;
    
    return {
      passed,
      response,
      error: passed ? null : `Expected status ${expectedStatus}, got ${response.statusCode}`
    };
  } catch (error) {
    return {
      passed: false,
      response: null,
      error: error.message
    };
  }
}

async function testCartFunctionality() {
  logSection('Testing Cart Functionality');
  
  // Test 1: Add item to cart (simulated)
  const addToCartTest = await testApiEndpoint('/api/cart/add', 'POST', {
    productId: 'test-product-1',
    quantity: 2,
    selectedVariants: { color: 'red', size: 'M' }
  }, 200);
  
  logTest('Add item to cart', addToCartTest.passed, addToCartTest.error);
  
  // Test 2: Get cart contents
  const getCartTest = await testApiEndpoint('/api/cart', 'GET', null, 200);
  logTest('Get cart contents', getCartTest.passed, getCartTest.error);
  
  // Test 3: Update cart item quantity
  const updateCartTest = await testApiEndpoint('/api/cart/update', 'PUT', {
    itemId: 'test-item-1',
    quantity: 3
  }, 200);
  logTest('Update cart item quantity', updateCartTest.passed, updateCartTest.error);
  
  // Test 4: Remove item from cart
  const removeCartTest = await testApiEndpoint('/api/cart/remove', 'DELETE', {
    itemId: 'test-item-1'
  }, 200);
  logTest('Remove item from cart', removeCartTest.passed, removeCartTest.error);
}

async function testOrderCreation() {
  logSection('Testing Order Creation');
  
  const orderData = {
    businessOwnerId: 'test-business-owner-1',
    items: [
      {
        productId: 'test-product-1',
        quantity: 2,
        price: 25.00,
        customizations: { color: 'red', size: 'M' }
      },
      {
        productId: 'test-product-2',
        quantity: 1,
        price: 15.00,
        customizations: { color: 'blue', size: 'L' }
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Test Company',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
      phone: '555-1234'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'US',
      phone: '555-1234'
    },
    paymentMethod: 'card',
    notes: 'Please handle with care',
    shippingCost: 9.99
  };
  
  // Test 1: Create order
  const createOrderTest = await testApiEndpoint('/api/orders', 'POST', orderData, 201);
  logTest('Create order', createOrderTest.passed, createOrderTest.error);
  
  if (createOrderTest.passed && createOrderTest.response.data.order) {
    const orderId = createOrderTest.response.data.order.id;
    
    // Test 2: Get order details
    const getOrderTest = await testApiEndpoint(`/api/orders/${orderId}`, 'GET', null, 200);
    logTest('Get order details', getOrderTest.passed, getOrderTest.error);
    
    // Test 3: Update order status
    const updateStatusTest = await testApiEndpoint(`/api/orders/${orderId}/status`, 'PUT', {
      status: 'processing',
      notes: 'Order is being processed'
    }, 200);
    logTest('Update order status', updateStatusTest.passed, updateStatusTest.error);
    
    // Test 4: Add tracking number
    const addTrackingTest = await testApiEndpoint(`/api/orders/${orderId}/tracking`, 'PUT', {
      trackingNumber: 'TRACK123456',
      carrier: 'UPS',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, 200);
    logTest('Add tracking number', addTrackingTest.passed, addTrackingTest.error);
    
    // Test 5: Get tracking information
    const getTrackingTest = await testApiEndpoint(`/api/orders/${orderId}/tracking`, 'GET', null, 200);
    logTest('Get tracking information', getTrackingTest.passed, getTrackingTest.error);
  }
}

async function testOrderManagement() {
  logSection('Testing Order Management');
  
  // Test 1: Get orders list
  const getOrdersTest = await testApiEndpoint('/api/orders', 'GET', null, 200);
  logTest('Get orders list', getOrdersTest.passed, getOrdersTest.error);
  
  // Test 2: Get orders with filters
  const getFilteredOrdersTest = await testApiEndpoint('/api/orders?status=pending&limit=10', 'GET', null, 200);
  logTest('Get filtered orders', getFilteredOrdersTest.passed, getFilteredOrdersTest.error);
  
  // Test 3: Get orders by business owner
  const getBusinessOrdersTest = await testApiEndpoint('/api/orders?businessOwnerId=test-business-owner-1', 'GET', null, 200);
  logTest('Get orders by business owner', getBusinessOrdersTest.passed, getBusinessOrdersTest.error);
  
  // Test 4: Get orders by customer
  const getCustomerOrdersTest = await testApiEndpoint('/api/orders?customerId=test-customer-1', 'GET', null, 200);
  logTest('Get orders by customer', getCustomerOrdersTest.passed, getCustomerOrdersTest.error);
}

async function testOrderStatusWorkflow() {
  logSection('Testing Order Status Workflow');
  
  // Create a test order first
  const orderData = {
    businessOwnerId: 'test-business-owner-1',
    items: [{ productId: 'test-product-1', quantity: 1, price: 25.00 }],
    shippingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '456 Oak Avenue',
      city: 'Somewhere',
      state: 'NY',
      zipCode: '67890',
      country: 'US',
      phone: '555-5678'
    },
    paymentMethod: 'card',
    shippingCost: 5.99
  };
  
  const createOrderTest = await testApiEndpoint('/api/orders', 'POST', orderData, 201);
  
  if (createOrderTest.passed && createOrderTest.response.data.order) {
    const orderId = createOrderTest.response.data.order.id;
    
    // Test status transitions
    const statusTransitions = [
      { from: 'pending', to: 'processing' },
      { from: 'processing', to: 'shipped' },
      { from: 'shipped', to: 'delivered' }
    ];
    
    for (const transition of statusTransitions) {
      const statusTest = await testApiEndpoint(`/api/orders/${orderId}/status`, 'PUT', {
        status: transition.to
      }, 200);
      logTest(`Status transition: ${transition.from} → ${transition.to}`, statusTest.passed, statusTest.error);
    }
    
    // Test invalid status transition
    const invalidStatusTest = await testApiEndpoint(`/api/orders/${orderId}/status`, 'PUT', {
      status: 'pending'
    }, 400);
    logTest('Invalid status transition (delivered → pending)', invalidStatusTest.passed, invalidStatusTest.error);
  }
}

async function testOrderCancellation() {
  logSection('Testing Order Cancellation');
  
  // Create a test order
  const orderData = {
    businessOwnerId: 'test-business-owner-1',
    items: [{ productId: 'test-product-1', quantity: 1, price: 25.00 }],
    shippingAddress: {
      firstName: 'Bob',
      lastName: 'Johnson',
      address1: '789 Pine Street',
      city: 'Elsewhere',
      state: 'TX',
      zipCode: '54321',
      country: 'US',
      phone: '555-9012'
    },
    paymentMethod: 'card',
    shippingCost: 7.99
  };
  
  const createOrderTest = await testApiEndpoint('/api/orders', 'POST', orderData, 201);
  
  if (createOrderTest.passed && createOrderTest.response.data.order) {
    const orderId = createOrderTest.response.data.order.id;
    
    // Test order cancellation
    const cancelOrderTest = await testApiEndpoint(`/api/orders/${orderId}`, 'DELETE', null, 200);
    logTest('Cancel order', cancelOrderTest.passed, cancelOrderTest.error);
    
    // Verify order is cancelled
    const getCancelledOrderTest = await testApiEndpoint(`/api/orders/${orderId}`, 'GET', null, 200);
    if (getCancelledOrderTest.passed) {
      const isCancelled = getCancelledOrderTest.response.data.order.status === 'cancelled';
      logTest('Verify order is cancelled', isCancelled, isCancelled ? null : 'Order status is not cancelled');
    }
  }
}

async function testErrorHandling() {
  logSection('Testing Error Handling');
  
  // Test 1: Get non-existent order
  const getNonExistentOrderTest = await testApiEndpoint('/api/orders/non-existent-id', 'GET', null, 404);
  logTest('Get non-existent order (404)', getNonExistentOrderTest.passed, getNonExistentOrderTest.error);
  
  // Test 2: Create order with invalid data
  const invalidOrderTest = await testApiEndpoint('/api/orders', 'POST', {
    // Missing required fields
    items: []
  }, 400);
  logTest('Create order with invalid data (400)', invalidOrderTest.passed, invalidOrderTest.error);
  
  // Test 3: Update order with invalid status
  const invalidStatusTest = await testApiEndpoint('/api/orders/test-order-id/status', 'PUT', {
    status: 'invalid-status'
  }, 400);
  logTest('Update order with invalid status (400)', invalidStatusTest.passed, invalidStatusTest.error);
  
  // Test 4: Unauthorized access
  const unauthorizedTest = await testApiEndpoint('/api/orders', 'GET', null, 401);
  logTest('Unauthorized access (401)', unauthorizedTest.passed, unauthorizedTest.error);
}

async function testPerformance() {
  logSection('Testing Performance');
  
  const startTime = Date.now();
  
  // Test multiple concurrent requests
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(testApiEndpoint('/api/orders', 'GET', null, 200));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const allPassed = results.every(result => result.passed);
  logTest(`10 concurrent requests completed in ${duration}ms`, allPassed, allPassed ? null : 'Some requests failed');
  
  // Test response time
  const responseTimeTest = duration < 5000; // Should complete within 5 seconds
  logTest('Response time acceptable (< 5s)', responseTimeTest, responseTimeTest ? null : `Took ${duration}ms`);
}

async function runAllTests() {
  console.log('🚀 Starting Order System Tests');
  console.log(`📍 Testing against: ${config.baseUrl}`);
  console.log(`⏱️  Timeout: ${config.timeout}ms`);
  
  try {
    await testCartFunctionality();
    await testOrderCreation();
    await testOrderManagement();
    await testOrderStatusWorkflow();
    await testOrderCancellation();
    await testErrorHandling();
    await testPerformance();
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Order System Testing Script

Usage: node scripts/test-order-system.js [options]

Options:
  --base-url <url>    Base URL to test against (default: http://localhost:3000)
  --timeout <ms>      Request timeout in milliseconds (default: 10000)
  --help, -h          Show this help message

Environment Variables:
  TEST_BASE_URL       Base URL to test against
  TEST_TIMEOUT        Request timeout in milliseconds

Examples:
  node scripts/test-order-system.js
  node scripts/test-order-system.js --base-url https://staging.fabriqly.com
  TEST_BASE_URL=https://production.fabriqly.com node scripts/test-order-system.js
`);
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i + 1]) {
    config.baseUrl = args[i + 1];
    i++;
  } else if (args[i] === '--timeout' && args[i + 1]) {
    config.timeout = parseInt(args[i + 1]);
    i++;
  }
}

// Run tests
runAllTests();


