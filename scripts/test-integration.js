#!/usr/bin/env node

/**
 * Product Catalog Integration Testing Script
 * 
 * This script tests complete user workflows
 * Run with: npm run test:integration
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

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
  log(`\n${colors.bold}🧪 Integration Test: ${testName}${colors.reset}`);
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

async function checkPageAccessibility(endpoint, expectedTitle) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const html = await response.text();
    const hasTitle = html.includes(expectedTitle) || html.includes('<title>');
    
    return {
      success: true,
      hasTitle,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCustomerWorkflow() {
  logTest('Customer Product Browsing Workflow');
  
  const pages = [
    { endpoint: '/products', title: 'Products' },
    { endpoint: '/products/1', title: 'Product' }, // Assuming product ID 1 exists
  ];
  
  let passed = 0;
  let total = pages.length;
  
  for (const page of pages) {
    const result = await checkPageAccessibility(page.endpoint, page.title);
    
    if (result.success) {
      logSuccess(`Page accessible: ${page.endpoint} (${result.status})`);
      passed++;
    } else {
      logError(`Page not accessible: ${page.endpoint} - ${result.error}`);
    }
  }
  
  logInfo(`Customer workflow: ${passed}/${total} pages accessible`);
  return { passed, total };
}

async function testBusinessOwnerWorkflow() {
  logTest('Business Owner Product Management Workflow');
  
  const pages = [
    { endpoint: '/dashboard/products', title: 'Products' },
    { endpoint: '/dashboard/products/create', title: 'Create' },
  ];
  
  let passed = 0;
  let total = pages.length;
  
  for (const page of pages) {
    const result = await checkPageAccessibility(page.endpoint, page.title);
    
    if (result.success) {
      logSuccess(`Page accessible: ${page.endpoint} (${result.status})`);
      passed++;
    } else {
      logError(`Page not accessible: ${page.endpoint} - ${result.error}`);
    }
  }
  
  logInfo(`Business owner workflow: ${passed}/${total} pages accessible`);
  return { passed, total };
}

async function testAdminWorkflow() {
  logTest('Admin Category Management Workflow');
  
  const pages = [
    { endpoint: '/dashboard/admin/categories', title: 'Categories' },
  ];
  
  let passed = 0;
  let total = pages.length;
  
  for (const page of pages) {
    const result = await checkPageAccessibility(page.endpoint, page.title);
    
    if (result.success) {
      logSuccess(`Page accessible: ${page.endpoint} (${result.status})`);
      passed++;
    } else {
      logError(`Page not accessible: ${page.endpoint} - ${result.error}`);
    }
  }
  
  logInfo(`Admin workflow: ${passed}/${total} pages accessible`);
  return { passed, total };
}

async function testAPIEndpoints() {
  logTest('API Endpoints Integration');
  
  const endpoints = [
    '/api/products',
    '/api/categories',
  ];
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      if (response.ok) {
        logSuccess(`API endpoint working: ${endpoint} (${response.status})`);
        passed++;
      } else {
        logError(`API endpoint failed: ${endpoint} - HTTP ${response.status}`);
      }
    } catch (error) {
      logError(`API endpoint error: ${endpoint} - ${error.message}`);
    }
  }
  
  logInfo(`API integration: ${passed}/${total} endpoints working`);
  return { passed, total };
}

async function testTestPage() {
  logTest('Testing Interface Accessibility');
  
  const testPages = [
    '/test-product-catalog',
    '/test-auth',
    '/test-ui',
  ];
  
  let passed = 0;
  let total = testPages.length;
  
  for (const page of testPages) {
    const result = await checkPageAccessibility(page, 'Test');
    
    if (result.success) {
      logSuccess(`Test page accessible: ${page} (${result.status})`);
      passed++;
    } else {
      logWarning(`Test page not accessible: ${page} - ${result.error}`);
    }
  }
  
  logInfo(`Test pages: ${passed}/${total} accessible`);
  return { passed, total };
}

async function runIntegrationTests() {
  log(`${colors.bold}${colors.blue}🚀 Starting Product Catalog Integration Tests${colors.reset}`);
  log(`Base URL: ${BASE_URL}`);
  
  const results = {
    customer: { passed: 0, total: 0 },
    businessOwner: { passed: 0, total: 0 },
    admin: { passed: 0, total: 0 },
    api: { passed: 0, total: 0 },
    testPages: { passed: 0, total: 0 }
  };
  
  try {
    // Test different user workflows
    results.customer = await testCustomerWorkflow();
    results.businessOwner = await testBusinessOwnerWorkflow();
    results.admin = await testAdminWorkflow();
    results.api = await testAPIEndpoints();
    results.testPages = await testTestPage();
    
  } catch (error) {
    logError(`Integration test execution failed: ${error.message}`);
  }
  
  // Calculate totals
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  
  // Summary
  log(`\n${colors.bold}📊 Integration Test Summary:${colors.reset}`);
  log(`Customer Workflow: ${results.customer.passed}/${results.customer.total}`);
  log(`Business Owner Workflow: ${results.businessOwner.passed}/${results.businessOwner.total}`);
  log(`Admin Workflow: ${results.admin.passed}/${results.admin.total}`);
  log(`API Integration: ${results.api.passed}/${results.api.total}`);
  log(`Test Pages: ${results.testPages.passed}/${results.testPages.total}`);
  log(`\nOverall: ${totalPassed}/${totalTests} tests passed`);
  log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  
  // Recommendations
  log(`\n${colors.bold}💡 Recommendations:${colors.reset}`);
  
  if (results.customer.passed < results.customer.total) {
    logWarning('Customer pages may need authentication or have routing issues');
  }
  
  if (results.businessOwner.passed < results.businessOwner.total) {
    logWarning('Business owner pages may require authentication');
  }
  
  if (results.api.passed < results.api.total) {
    logWarning('API endpoints may need proper error handling or authentication');
  }
  
  if (totalPassed === totalTests) {
    log(`\n${colors.green}🎉 All integration tests passed!${colors.reset}`);
    logInfo('Your product catalog system is working correctly');
  } else {
    log(`\n${colors.yellow}⚠️  Some integration tests failed.${colors.reset}`);
    logInfo('Check the output above for specific issues to address');
  }
  
  return totalPassed === totalTests;
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  logError('This script requires Node.js 18+ or a fetch polyfill');
  logInfo('You can install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run integration tests
runIntegrationTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

