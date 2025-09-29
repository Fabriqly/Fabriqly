#!/usr/bin/env node

/**
 * 📅 Scheduled Dashboard Summary Refresh Script
 * 
 * This script can be run via:
 * - CRON job (crontab -e): */5 * * * * node /path/to/script/scheduled-summary-refresh.js
 * - GitHub Actions
 * - Heroku Scheduler
 * - Vercel Cron Jobs
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const url = require('url');

// Configuration
const CONFIG = {
  apiUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  adminKey: process.env.ADMIN_C_API_KEY || 'admin-key',
  timeout: 30000, // 30 seconds
  retries: 3
};

/**
 * Make HTTP request to refresh summary
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(CONFIG.timeout);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Refresh dashboard summary
 */
async function refreshSummary() {
  const apiUrl = `${CONFIG.apiUrl}/api/admin/refresh-summary`;
  const parsedUrl = url.parse(apiUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.adminKey}`,
      'User-Agent': 'Fabriqly-Summary-Refresh/1.0'
    }
  };
  
  console.log(`🔄 Refreshing dashboard summary via ${CONFIG.apiUrl}...`);
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard summary refreshed successfully');
      console.log(`📊 Stats: Users=${response.data.summary.totalUsers}, Products=${response.data.summary.totalProducts}, Orders=${response.data.summary.totalOrders}`);
      console.log(`💰 Revenue: $${response.data.summary.totalRevenue.toLocaleString()}`);
      console.log(`⏰ Last Updated: ${response.data.summary.lastUpdated}`);
      return true;
    } else {
      console.error('❌ Failed to refresh summary:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error refreshing summary:', error.message);
    return false;
  }
}

/**
 * Get summary status
 */
async function getSummaryStatus() {
  const apiUrl = `${CONFIG.apiUrl}/api/admin/refresh-summary`;
  const parsedUrl = url.parse(apiUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CONFIG.adminKey}`,
      'User-Agent': 'Fabriqly-Summary-Status/1.0'
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200 && response.data.summary) {
      console.log('📊 Current Summary Status:');
      console.log(`   Users: ${response.data.summary.totalUsers}`);
      console.log(`   Products: ${response.data.summary.totalProducts}`);
      console.log(`   Orders: ${response.data.summary.totalOrders}`);
      console.log(`   Last Updated: ${response.data.summary.lastUpdated}`);
      console.log(`   Updated By: ${response.data.summary.lastUpdatedBy}`);
      console.log(`   Cache Status: ${response.data.debug.summaryExists ? '✅' : '❌'} Summary, ${response.data.debug.cacheExists ? '✅' : '❌'} Cache`);
      return response.data;
    } else {
      console.log('ℹ️ No summary data available - will be created on next refresh');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting summary status:', error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  console.log(`🚀 Starting scheduled summary refresh at ${new Date().toISOString()}`);
  
  try {
    // Try to refresh with retries
    let success = false;
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${CONFIG.retries}`);
      success = await refreshSummary();
      
      if (success) {
        break;
      } else if (attempt < CONFIG.retries) {
        const delay = attempt * 2000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (success) {
      console.log(`✅ Summary refresh completed successfully in ${Date.now() - startTime}ms`);
      
      // Show current status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
      await getSummaryStatus();
    } else {
      console.error(`❌ Summary refresh failed after ${CONFIG.retries} attempts`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error in summary refresh:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  // Check environment
  if (!process.env.NEXTAUTH_URL) {
    console.error('❌ NEXTAUTH_URL environment variable not set');
    process.exit(1);
  }
  
  if (!process.env.ADMIN_C_API_KEY) {
    console.warn('⚠️ ADMIN_C_API_KEY not set - using default (may cause auth issues)');
  }
  
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  refreshSummary,
  getSummaryStatus,
  CONFIG
};
