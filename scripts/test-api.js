#!/usr/bin/env node

/**
 * Automated API Testing Script for Product System
 * Tests all the optimized API endpoints with various scenarios
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test data
const TEST_DATA = {
  validProduct: {
    name: 'Test Product API',
    description: 'This is a test product created by the API testing script',
    shortDescription: 'Test product',
    categoryId: 'test-category-id', // You'll need to create this
    price: 29.99,
    stockQuantity: 10,
  isCustomizable: true,
  isDigital: false,
    tags: ['test', 'api', 'automated'],
  specifications: {
      'Material': 'Cotton',
      'Size': 'Medium'
    }
  },
  invalidProduct: {
    name: '',
    description: 'Test',
    price: -10
  },
  updateData: {
    name: 'Updated Test Product',
    price: 39.99,
    stockQuantity: 15
  }
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }
  testResults.details.push({ testName, passed, details });
}

// Test functions
async function testProductsListAPI() {
  console.log('\n🧪 Testing Products List API...');
  
  try {
    // Test basic list
    const response = await makeRequest('GET', '/api/products');
    logTest('Basic products list', response.status === 200, 
      `Status: ${response.status}, Products: ${response.body.products?.length || 0}`);
    
    // Test with limit
    const limitedResponse = await makeRequest('GET', '/api/products?limit=5');
    logTest('Products list with limit', 
      limitedResponse.status === 200 && limitedResponse.body.products?.length <= 5);
    
    // Test with search
    const searchResponse = await makeRequest('GET', '/api/products?search=test');
    logTest('Products list with search', searchResponse.status === 200);
    
    // Test with category filter
    const categoryResponse = await makeRequest('GET', '/api/products?categoryId=test-category');
    logTest('Products list with category filter', categoryResponse.status === 200);
    
    // Test with price range
    const priceResponse = await makeRequest('GET', '/api/products?minPrice=10&maxPrice=100');
    logTest('Products list with price range', priceResponse.status === 200);
    
    // Test with multiple filters
    const multiFilterResponse = await makeRequest('GET', '/api/products?categoryId=test&minPrice=20&isCustomizable=true');
    logTest('Products list with multiple filters', multiFilterResponse.status === 200);
    
  } catch (error) {
    logTest('Products list API', false, error.message);
  }
}

async function testIndividualProductAPI() {
  console.log('\n🧪 Testing Individual Product API...');
  
  try {
    // First, get a product ID from the list
    const listResponse = await makeRequest('GET', '/api/products?limit=1');
    if (listResponse.status === 200 && listResponse.body.products?.length > 0) {
      const productId = listResponse.body.products[0].id;
      
      // Test valid product
      const productResponse = await makeRequest('GET', `/api/products/${productId}`);
      logTest('Get individual product', productResponse.status === 200,
        `Status: ${productResponse.status}, Product: ${productResponse.body.product?.name || 'N/A'}`);
      
      // Test caching (second request should be faster)
      const startTime = Date.now();
      const cachedResponse = await makeRequest('GET', `/api/products/${productId}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      logTest('Product caching performance', 
        cachedResponse.status === 200 && responseTime < 1000,
        `Response time: ${responseTime}ms`);
      
  } else {
      logTest('Get individual product', false, 'No products available for testing');
    }
    
    // Test invalid product ID
    const invalidResponse = await makeRequest('GET', '/api/products/invalid-id');
    logTest('Get invalid product', invalidResponse.status === 404);
    
  } catch (error) {
    logTest('Individual product API', false, error.message);
  }
}

async function testProductCreationAPI() {
  console.log('\n🧪 Testing Product Creation API...');
  
  try {
    // Test valid product creation
    const createResponse = await makeRequest('POST', '/api/products', TEST_DATA.validProduct);
    logTest('Create valid product', createResponse.status === 201,
      `Status: ${createResponse.status}, Product ID: ${createResponse.body.product?.id || 'N/A'}`);
    
    let createdProductId = null;
    if (createResponse.status === 201) {
      createdProductId = createResponse.body.product?.id;
    }
    
    // Test invalid product creation
    const invalidCreateResponse = await makeRequest('POST', '/api/products', TEST_DATA.invalidProduct);
    logTest('Create invalid product', invalidCreateResponse.status === 400,
      `Status: ${invalidCreateResponse.status}, Errors: ${JSON.stringify(invalidCreateResponse.body.details || [])}`);
    
    // Test duplicate SKU (if we have a created product)
    if (createdProductId) {
      const duplicateSkuData = {
        ...TEST_DATA.validProduct,
        sku: createResponse.body.product?.sku
      };
      const duplicateResponse = await makeRequest('POST', '/api/products', duplicateSkuData);
      logTest('Create product with duplicate SKU', duplicateResponse.status === 400);
    }
    
    // Test unauthorized access
    const unauthorizedResponse = await makeRequest('POST', '/api/products', TEST_DATA.validProduct, {
      'Authorization': 'Bearer invalid-token'
    });
    logTest('Create product unauthorized', unauthorizedResponse.status === 401);
    
    return createdProductId;
    
  } catch (error) {
    logTest('Product creation API', false, error.message);
    return null;
  }
}

async function testProductUpdateAPI(productId) {
  console.log('\n🧪 Testing Product Update API...');
  
  if (!productId) {
    logTest('Update product', false, 'No product ID available for testing');
    return;
  }
  
  try {
    // Test valid update
    const updateResponse = await makeRequest('PUT', `/api/products/${productId}`, TEST_DATA.updateData);
    logTest('Update valid product', updateResponse.status === 200,
      `Status: ${updateResponse.status}, Updated name: ${updateResponse.body.product?.name || 'N/A'}`);
    
    // Test partial update
    const partialUpdateResponse = await makeRequest('PUT', `/api/products/${productId}`, {
      price: 49.99
    });
    logTest('Partial product update', partialUpdateResponse.status === 200);
    
    // Test invalid update
    const invalidUpdateResponse = await makeRequest('PUT', `/api/products/${productId}`, {
      price: -10
    });
    logTest('Update product with invalid data', invalidUpdateResponse.status === 400);
    
    // Test unauthorized update
    const unauthorizedUpdateResponse = await makeRequest('PUT', `/api/products/${productId}`, TEST_DATA.updateData, {
      'Authorization': 'Bearer invalid-token'
    });
    logTest('Update product unauthorized', unauthorizedUpdateResponse.status === 401);
    
  } catch (error) {
    logTest('Product update API', false, error.message);
  }
}

async function testProductDeletionAPI(productId) {
  console.log('\n🧪 Testing Product Deletion API...');
  
  if (!productId) {
    logTest('Delete product', false, 'No product ID available for testing');
    return;
  }
  
  try {
    // Test valid deletion
    const deleteResponse = await makeRequest('DELETE', `/api/products/${productId}`);
    logTest('Delete valid product', deleteResponse.status === 200,
      `Status: ${deleteResponse.status}, Success: ${deleteResponse.body.success || false}`);
    
    // Test deletion of non-existent product
    const invalidDeleteResponse = await makeRequest('DELETE', '/api/products/invalid-id');
    logTest('Delete invalid product', invalidDeleteResponse.status === 404);
    
    // Test unauthorized deletion
    const unauthorizedDeleteResponse = await makeRequest('DELETE', `/api/products/${productId}`, null, {
      'Authorization': 'Bearer invalid-token'
    });
    logTest('Delete product unauthorized', unauthorizedDeleteResponse.status === 401);
    
  } catch (error) {
    logTest('Product deletion API', false, error.message);
  }
}

async function testPerformanceMetrics() {
  console.log('\n🧪 Testing Performance Metrics...');
  
  try {
    // Test products list performance
    const startTime = Date.now();
    const response = await makeRequest('GET', '/api/products');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logTest('Products list performance', 
      response.status === 200 && responseTime < 500,
      `Response time: ${responseTime}ms (target: <500ms)`);
    
    // Test individual product performance
    if (response.body.products?.length > 0) {
      const productId = response.body.products[0].id;
      const productStartTime = Date.now();
      const productResponse = await makeRequest('GET', `/api/products/${productId}`);
      const productEndTime = Date.now();
      const productResponseTime = productEndTime - productStartTime;
      
      logTest('Individual product performance',
        productResponse.status === 200 && productResponseTime < 300,
        `Response time: ${productResponseTime}ms (target: <300ms)`);
    }
    
  } catch (error) {
    logTest('Performance metrics', false, error.message);
  }
}

async function testCachingBehavior() {
  console.log('\n🧪 Testing Caching Behavior...');
  
  try {
    // Test category caching
    const firstRequestStart = Date.now();
    await makeRequest('GET', '/api/products');
    const firstRequestTime = Date.now() - firstRequestStart;
    
    const secondRequestStart = Date.now();
    await makeRequest('GET', '/api/products');
    const secondRequestTime = Date.now() - secondRequestStart;
    
    logTest('Category caching performance',
      secondRequestTime < firstRequestTime,
      `First: ${firstRequestTime}ms, Second: ${secondRequestTime}ms`);
    
  } catch (error) {
    logTest('Caching behavior', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Product System API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' * 50);
  
  const startTime = Date.now();
  
  // Run all tests
  await testProductsListAPI();
  await testIndividualProductAPI();
  const createdProductId = await testProductCreationAPI();
  await testProductUpdateAPI(createdProductId);
  await testProductDeletionAPI(createdProductId);
  await testPerformanceMetrics();
  await testCachingBehavior();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Print results
  console.log('\n' + '=' * 50);
  console.log('📊 Test Results Summary');
  console.log('=' * 50);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
  }
  
  console.log('\n🎉 Testing completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Product System API Testing Script

Usage: node test-api.js [options]

Options:
  --help, -h          Show this help message
  --url <url>         Set the API base URL (default: http://localhost:3000)
  --timeout <ms>      Set request timeout (default: 10000ms)

Environment Variables:
  API_BASE_URL        Set the API base URL

Examples:
  node test-api.js
  node test-api.js --url http://localhost:3001
  API_BASE_URL=http://staging.example.com node test-api.js
  `);
    process.exit(0);
  }

// Parse command line arguments
const urlArg = process.argv.indexOf('--url');
if (urlArg !== -1 && process.argv[urlArg + 1]) {
  process.env.API_BASE_URL = process.argv[urlArg + 1];
}

const timeoutArg = process.argv.indexOf('--timeout');
if (timeoutArg !== -1 && process.argv[timeoutArg + 1]) {
  TEST_TIMEOUT = parseInt(process.argv[timeoutArg + 1]);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});