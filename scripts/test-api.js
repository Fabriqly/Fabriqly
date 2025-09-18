#!/usr/bin/env node

/**
 * Product Catalog API Testing Script
 * 
 * This script tests all product catalog API endpoints
 * Run with: npm run test:api
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Test data
const testProduct = {
  name: 'API Test Product',
  description: 'This is a test product created via API testing script',
  shortDescription: 'API Test Product',
  categoryId: 'test-category-id', // You'll need to create a category first
  price: 19.99,
  stockQuantity: 5,
  isCustomizable: true,
  isDigital: false,
  tags: ['test', 'api'],
  specifications: {
    material: 'Test Material',
    size: 'Test Size'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      url
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: `${BASE_URL}${endpoint}`
    };
  }
}

async function testCategories() {
  logTest('Categories API');
  
  const result = await makeRequest('/api/categories');
  
  if (result.success) {
    logSuccess(`Categories loaded successfully (${result.status})`);
    logInfo(`Found ${result.data.categories?.length || 0} categories`);
    if (result.data.categories?.length > 0) {
      logInfo(`First category: ${result.data.categories[0].name}`);
    }
  } else {
    logError(`Categories test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testProductsList() {
  logTest('Products List API');
  
  const result = await makeRequest('/api/products');
  
  if (result.success) {
    logSuccess(`Products list loaded successfully (${result.status})`);
    logInfo(`Found ${result.data.products?.length || 0} products`);
    logInfo(`Total: ${result.data.total || 0}, Has More: ${result.data.hasMore || false}`);
  } else {
    logError(`Products list test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testProductSearch() {
  logTest('Product Search API');
  
  const result = await makeRequest('/api/products?search=test&limit=5');
  
  if (result.success) {
    logSuccess(`Product search successful (${result.status})`);
    logInfo(`Search results: ${result.data.products?.length || 0} products`);
  } else {
    logError(`Product search test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testProductFilters() {
  logTest('Product Filters API');
  
  const result = await makeRequest('/api/products?isCustomizable=true&minPrice=10&maxPrice=100&limit=3');
  
  if (result.success) {
    logSuccess(`Product filters successful (${result.status})`);
    logInfo(`Filtered results: ${result.data.products?.length || 0} products`);
  } else {
    logError(`Product filters test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testCreateProduct() {
  logTest('Create Product API');
  
  const result = await makeRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(testProduct)
  });
  
  if (result.success) {
    logSuccess(`Product created successfully (${result.status})`);
    logInfo(`Created product ID: ${result.data.product?.id}`);
    return result.data.product?.id;
  } else {
    logError(`Create product test failed: ${result.error || result.data?.error}`);
    return null;
  }
}

async function testGetProduct(productId) {
  if (!productId) {
    logWarning('Skipping get product test - no product ID available');
    return null;
  }
  
  logTest('Get Single Product API');
  
  const result = await makeRequest(`/api/products/${productId}`);
  
  if (result.success) {
    logSuccess(`Product retrieved successfully (${result.status})`);
    logInfo(`Product name: ${result.data.product?.name}`);
  } else {
    logError(`Get product test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testProductImages(productId) {
  if (!productId) {
    logWarning('Skipping product images test - no product ID available');
    return null;
  }
  
  logTest('Product Images API');
  
  const result = await makeRequest(`/api/products/${productId}/images`);
  
  if (result.success) {
    logSuccess(`Product images loaded successfully (${result.status})`);
    logInfo(`Found ${result.data.images?.length || 0} images`);
  } else {
    logError(`Product images test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function testProductColors(productId) {
  if (!productId) {
    logWarning('Skipping product colors test - no product ID available');
    return null;
  }
  
  logTest('Product Colors API');
  
  const result = await makeRequest(`/api/products/${productId}/colors`);
  
  if (result.success) {
    logSuccess(`Product colors loaded successfully (${result.status})`);
    logInfo(`Found ${result.data.colors?.length || 0} colors`);
  } else {
    logError(`Product colors test failed: ${result.error || result.data?.error}`);
  }
  
  return result;
}

async function runAllTests() {
  log(`${colors.bold}${colors.blue}🚀 Starting Product Catalog API Tests${colors.reset}`);
  log(`Base URL: ${BASE_URL}`);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  try {
    // Test basic endpoints
    const categoriesResult = await testCategories();
    results.total++;
    if (categoriesResult.success) results.passed++; else results.failed++;
    
    const productsResult = await testProductsList();
    results.total++;
    if (productsResult.success) results.passed++; else results.failed++;
    
    const searchResult = await testProductSearch();
    results.total++;
    if (searchResult.success) results.passed++; else results.failed++;
    
    const filtersResult = await testProductFilters();
    results.total++;
    if (filtersResult.success) results.passed++; else results.failed++;
    
    // Test product creation and related endpoints
    const productId = await testCreateProduct();
    results.total++;
    if (productId) results.passed++; else results.failed++;
    
    if (productId) {
      const getProductResult = await testGetProduct(productId);
      results.total++;
      if (getProductResult?.success) results.passed++; else results.failed++;
      
      const imagesResult = await testProductImages(productId);
      results.total++;
      if (imagesResult?.success) results.passed++; else results.failed++;
      
      const colorsResult = await testProductColors(productId);
      results.total++;
      if (colorsResult?.success) results.passed++; else results.failed++;
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
  }
  
  // Summary
  log(`\n${colors.bold}📊 Test Summary:${colors.reset}`);
  log(`Total Tests: ${results.total}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    log(`\n${colors.yellow}⚠️  Some tests failed. Check the output above for details.${colors.reset}`);
    process.exit(1);
  } else {
    log(`\n${colors.green}🎉 All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  logError('This script requires Node.js 18+ or a fetch polyfill');
  logInfo('You can install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run tests
runAllTests().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

