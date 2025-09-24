#!/usr/bin/env node

/**
 * Performance Testing Script for Product System
 * Tests the performance improvements and caching optimizations
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = 10;
const TEST_DURATION = 30000; // 30 seconds

// Performance metrics
const metrics = {
  requests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimes: [],
  errors: []
};

// Utility functions
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const startTime = performance.now();
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        metrics.requests++;
        metrics.totalResponseTime += responseTime;
        metrics.responseTimes.push(responseTime);
        
        if (responseTime < metrics.minResponseTime) {
          metrics.minResponseTime = responseTime;
        }
        if (responseTime > metrics.maxResponseTime) {
          metrics.maxResponseTime = responseTime;
        }
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
          metrics.errors.push({
            status: res.statusCode,
            path: path,
            responseTime: responseTime
          });
        }
        
        resolve({
          status: res.statusCode,
          responseTime: responseTime,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      metrics.requests++;
      metrics.failedRequests++;
      metrics.errors.push({
        error: error.message,
        path: path,
        responseTime: responseTime
      });
      
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function calculatePercentile(values, percentile) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function printMetrics() {
  const avgResponseTime = metrics.totalResponseTime / metrics.requests;
  const p50 = calculatePercentile(metrics.responseTimes, 50);
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  const p99 = calculatePercentile(metrics.responseTimes, 99);
  
  console.log('\n📊 Performance Metrics');
  console.log('=' * 50);
  console.log(`Total Requests: ${metrics.requests}`);
  console.log(`Successful Requests: ${metrics.successfulRequests}`);
  console.log(`Failed Requests: ${metrics.failedRequests}`);
  console.log(`Success Rate: ${((metrics.successfulRequests / metrics.requests) * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Min Response Time: ${metrics.minResponseTime.toFixed(2)}ms`);
  console.log(`Max Response Time: ${metrics.maxResponseTime.toFixed(2)}ms`);
  console.log(`50th Percentile: ${p50.toFixed(2)}ms`);
  console.log(`95th Percentile: ${p95.toFixed(2)}ms`);
  console.log(`99th Percentile: ${p99.toFixed(2)}ms`);
  
  if (metrics.errors.length > 0) {
    console.log('\n❌ Errors:');
    metrics.errors.slice(0, 10).forEach(error => {
      console.log(`   ${error.status || error.error} - ${error.path} (${error.responseTime.toFixed(2)}ms)`);
    });
    if (metrics.errors.length > 10) {
      console.log(`   ... and ${metrics.errors.length - 10} more errors`);
    }
  }
}

// Test scenarios
async function testProductsListPerformance() {
  console.log('🧪 Testing Products List Performance...');
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest('GET', '/api/products'));
  }
  
  try {
    await Promise.all(promises);
    console.log(`✅ Completed ${CONCURRENT_REQUESTS} concurrent requests to /api/products`);
  } catch (error) {
    console.log(`❌ Error in products list test: ${error.message}`);
  }
}

async function testBusinessOwnerQueryPerformance() {
  console.log('🧪 Testing Business Owner Query Performance...');
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(makeRequest('GET', '/api/products?businessOwnerId=test-business-owner'));
  }
  
  try {
    await Promise.all(promises);
    console.log(`✅ Completed ${CONCURRENT_REQUESTS} concurrent business owner queries`);
  } catch (error) {
    console.log(`❌ Error in business owner query test: ${error.message}`);
  }
}

async function testCachingPerformance() {
  console.log('🧪 Testing Caching Performance...');
  
  // First request (cache miss)
  const firstRequestStart = performance.now();
  await makeRequest('GET', '/api/products');
  const firstRequestTime = performance.now() - firstRequestStart;
  
  // Second request (cache hit)
  const secondRequestStart = performance.now();
  await makeRequest('GET', '/api/products');
  const secondRequestTime = performance.now() - secondRequestStart;
  
  const improvement = ((firstRequestTime - secondRequestTime) / firstRequestTime) * 100;
  
  console.log(`📈 Caching Performance:`);
  console.log(`   First Request: ${firstRequestTime.toFixed(2)}ms`);
  console.log(`   Second Request: ${secondRequestTime.toFixed(2)}ms`);
  console.log(`   Improvement: ${improvement.toFixed(2)}%`);
  
  if (improvement > 0) {
    console.log(`✅ Caching is working effectively`);
  } else {
    console.log(`⚠️  Caching may not be working as expected`);
  }
}

async function testSearchPerformance() {
  console.log('🧪 Testing Search Performance...');
  
  const searchTerms = ['test', 'product', 'shirt', 'digital', 'custom'];
  const promises = [];
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const searchTerm = searchTerms[i % searchTerms.length];
    promises.push(makeRequest('GET', `/api/products?search=${searchTerm}`));
  }
  
  try {
    await Promise.all(promises);
    console.log(`✅ Completed ${CONCURRENT_REQUESTS} concurrent search requests`);
  } catch (error) {
    console.log(`❌ Error in search test: ${error.message}`);
  }
}

async function testFilterPerformance() {
  console.log('🧪 Testing Filter Performance...');
  
  const filterCombinations = [
    '?categoryId=test&minPrice=10',
    '?isCustomizable=true&isDigital=false',
    '?minPrice=20&maxPrice=100',
    '?status=active&categoryId=test',
    '?isDigital=true&minPrice=5'
  ];
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const filter = filterCombinations[i % filterCombinations.length];
    promises.push(makeRequest('GET', `/api/products${filter}`));
  }
  
  try {
    await Promise.all(promises);
    console.log(`✅ Completed ${CONCURRENT_REQUESTS} concurrent filter requests`);
  } catch (error) {
    console.log(`❌ Error in filter test: ${error.message}`);
  }
}

async function testLoadTest() {
  console.log('🧪 Running Load Test...');
  
  const startTime = Date.now();
  const promises = [];
  
  // Create a continuous load test
  const loadTestInterval = setInterval(() => {
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('GET', '/api/products'));
    }
  }, 100); // Add 5 requests every 100ms
  
  // Stop after TEST_DURATION
  setTimeout(() => {
    clearInterval(loadTestInterval);
  }, TEST_DURATION);
  
  // Wait for all requests to complete
  await new Promise(resolve => {
    setTimeout(async () => {
      try {
        await Promise.allSettled(promises);
        resolve();
      } catch (error) {
        console.log(`⚠️  Some requests failed during load test: ${error.message}`);
        resolve();
      }
    }, TEST_DURATION + 5000); // Wait a bit longer to ensure all requests complete
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`✅ Load test completed in ${totalTime}ms`);
  console.log(`📊 Requests per second: ${(metrics.requests / (totalTime / 1000)).toFixed(2)}`);
}

async function testMemoryUsage() {
  console.log('🧪 Testing Memory Usage...');
  
  const initialMemory = process.memoryUsage();
  
  // Make many requests to test memory usage
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(makeRequest('GET', '/api/products'));
  }
  
  try {
    await Promise.all(promises);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log(`📊 Memory Usage:`);
    console.log(`   Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    if (memoryIncrease < 50 * 1024 * 1024) { // Less than 50MB increase
      console.log(`✅ Memory usage is within acceptable limits`);
    } else {
      console.log(`⚠️  Memory usage increased significantly`);
    }
  } catch (error) {
    console.log(`❌ Error in memory test: ${error.message}`);
  }
}

// Main performance test runner
async function runPerformanceTests() {
  console.log('🚀 Starting Product System Performance Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`⚡ Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log(`⏱️  Test duration: ${TEST_DURATION}ms`);
  console.log('=' * 50);
  
  const startTime = performance.now();
  
  try {
    // Run all performance tests
    await testProductsListPerformance();
    await testBusinessOwnerQueryPerformance();
    await testCachingPerformance();
    await testSearchPerformance();
    await testFilterPerformance();
    await testLoadTest();
    await testMemoryUsage();
    
  } catch (error) {
    console.error('💥 Performance test failed:', error);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  printMetrics();
  
  console.log('\n🎯 Performance Benchmarks');
  console.log('=' * 50);
  console.log(`✅ Average response time should be < 500ms`);
  console.log(`✅ 95th percentile should be < 1000ms`);
  console.log(`✅ Success rate should be > 95%`);
  console.log(`✅ Memory increase should be < 50MB`);
  
  const avgResponseTime = metrics.totalResponseTime / metrics.requests;
  const p95 = calculatePercentile(metrics.responseTimes, 95);
  const successRate = (metrics.successfulRequests / metrics.requests) * 100;
  
  console.log('\n📈 Results:');
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms ${avgResponseTime < 500 ? '✅' : '❌'}`);
  console.log(`   95th Percentile: ${p95.toFixed(2)}ms ${p95 < 1000 ? '✅' : '❌'}`);
  console.log(`   Success Rate: ${successRate.toFixed(2)}% ${successRate > 95 ? '✅' : '❌'}`);
  
  console.log('\n🎉 Performance testing completed!');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Product System Performance Testing Script

Usage: node test-performance.js [options]

Options:
  --help, -h          Show this help message
  --url <url>         Set the API base URL (default: http://localhost:3000)
  --concurrent <n>    Set number of concurrent requests (default: 10)
  --duration <ms>     Set test duration (default: 30000ms)

Environment Variables:
  API_BASE_URL        Set the API base URL

Examples:
  node test-performance.js
  node test-performance.js --url http://localhost:3001 --concurrent 20
  API_BASE_URL=http://staging.example.com node test-performance.js
  `);
  process.exit(0);
}

// Parse command line arguments
const urlArg = process.argv.indexOf('--url');
if (urlArg !== -1 && process.argv[urlArg + 1]) {
  process.env.API_BASE_URL = process.argv[urlArg + 1];
}

const concurrentArg = process.argv.indexOf('--concurrent');
if (concurrentArg !== -1 && process.argv[concurrentArg + 1]) {
  CONCURRENT_REQUESTS = parseInt(process.argv[concurrentArg + 1]);
}

const durationArg = process.argv.indexOf('--duration');
if (durationArg !== -1 && process.argv[durationArg + 1]) {
  TEST_DURATION = parseInt(process.argv[durationArg + 1]);
}

// Run performance tests
runPerformanceTests().catch(error => {
  console.error('💥 Performance test runner failed:', error);
  process.exit(1);
});
