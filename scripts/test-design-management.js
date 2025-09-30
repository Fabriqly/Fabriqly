#!/usr/bin/env node

/**
 * Design Management System Test Script
 * 
 * This script provides automated testing for the Design Management system
 * Run with: node scripts/test-design-management.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test runner
async function runTest(testName, testFunction) {
  try {
    console.log(`\n🧪 Running: ${testName}`);
    await testFunction();
    testResults.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test functions
async function testDesignsAPI() {
  const response = await makeRequest(`${API_BASE}/designs`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testDesignsWithFilters() {
  const response = await makeRequest(`${API_BASE}/designs?isPublic=true&limit=5`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testPopularDesigns() {
  const response = await makeRequest(`${API_BASE}/designs/popular?limit=10`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testFeaturedDesigns() {
  const response = await makeRequest(`${API_BASE}/designs/featured?limit=10`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testFreeDesigns() {
  const response = await makeRequest(`${API_BASE}/designs/free?limit=10`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testDesignStats() {
  const response = await makeRequest(`${API_BASE}/designs/stats`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.stats) {
    throw new Error('Response should contain stats object');
  }
  
  const requiredStats = ['totalDesigns', 'totalDownloads', 'totalViews', 'totalLikes'];
  for (const stat of requiredStats) {
    if (typeof response.data.stats[stat] !== 'number') {
      throw new Error(`Stats should contain ${stat} as a number`);
    }
  }
}

async function testUnauthorizedAccess() {
  const response = await makeRequest(`${API_BASE}/designs`, {
    method: 'POST',
    body: {
      designName: 'Test Design',
      description: 'Test Description',
      categoryId: 'test-category',
      designFileUrl: 'https://example.com/test.png',
      thumbnailUrl: 'https://example.com/thumb.png'
    }
  });
  
  if (response.status !== 401) {
    throw new Error(`Expected status 401 for unauthorized access, got ${response.status}`);
  }
}

async function testDesignsPage() {
  const response = await makeRequest(`${BASE_URL}/designs`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.includes('Discover Amazing Designs')) {
    throw new Error('Designs page should contain expected content');
  }
}

async function testDesignDetailPage() {
  // First get a design ID from the API
  const designsResponse = await makeRequest(`${API_BASE}/designs?limit=1`);
  
  if (designsResponse.status !== 200 || !designsResponse.data.designs.length) {
    throw new Error('No designs available for testing detail page');
  }
  
  const designId = designsResponse.data.designs[0].id;
  const response = await makeRequest(`${BASE_URL}/designs/${designId}`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200 for design detail page, got ${response.status}`);
  }
}

async function testDesignerDashboard() {
  const response = await makeRequest(`${BASE_URL}/dashboard/designs`);
  
  // Should redirect to login for unauthenticated users
  if (response.status !== 200 && response.status !== 302) {
    throw new Error(`Expected status 200 or 302, got ${response.status}`);
  }
}

async function testCategoriesAPI() {
  const response = await makeRequest(`${API_BASE}/categories`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.categories || !Array.isArray(response.data.categories)) {
    throw new Error('Response should contain categories array');
  }
}

async function testSearchFunctionality() {
  const response = await makeRequest(`${API_BASE}/designs?search=test&limit=5`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
}

async function testPagination() {
  const response = await makeRequest(`${API_BASE}/designs?limit=5&offset=0`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.designs || !Array.isArray(response.data.designs)) {
    throw new Error('Response should contain designs array');
  }
  
  if (response.data.designs.length > 5) {
    throw new Error('Pagination limit not working correctly');
  }
}

// Performance test
async function testPerformance() {
  const startTime = Date.now();
  
  await makeRequest(`${API_BASE}/designs`);
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (responseTime > 5000) {
    throw new Error(`API response time too slow: ${responseTime}ms`);
  }
  
  console.log(`   Response time: ${responseTime}ms`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Design Management System Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(50));

  // API Tests
  await runTest('Designs API - Basic functionality', testDesignsAPI);
  await runTest('Designs API - With filters', testDesignsWithFilters);
  await runTest('Popular Designs API', testPopularDesigns);
  await runTest('Featured Designs API', testFeaturedDesigns);
  await runTest('Free Designs API', testFreeDesigns);
  await runTest('Design Stats API', testDesignStats);
  await runTest('Categories API', testCategoriesAPI);
  await runTest('Search functionality', testSearchFunctionality);
  await runTest('Pagination', testPagination);
  await runTest('Unauthorized access protection', testUnauthorizedAccess);

  // Frontend Tests
  await runTest('Designs page loads', testDesignsPage);
  await runTest('Design detail page', testDesignDetailPage);
  await runTest('Designer dashboard access', testDesignerDashboard);

  // Performance Tests
  await runTest('API performance', testPerformance);

  // Print results
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n🔍 Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
