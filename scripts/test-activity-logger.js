// Integration test script for Activity Logger
// This script tests the ActivityLogger utility functions

const { ActivityLogger } = require('../src/utils/activity-logger');

// Mock data for testing
const mockData = {
  userId: 'test-user-123',
  userEmail: 'test@example.com',
  userName: 'Test User',
  productId: 'test-product-123',
  productName: 'Test Product',
  categoryId: 'test-category-123',
  categoryName: 'Test Category',
  colorId: 'test-color-123',
  colorName: 'Test Red',
  orderId: 'test-order-123',
  orderNumber: '#ORD-001',
  designId: 'test-design-123',
  designName: 'Test Design',
  shopId: 'test-shop-123',
  shopName: 'Test Shop',
  designerId: 'test-designer-123',
  designerName: 'Test Designer',
  adminId: 'admin-user-123'
};

// Test functions
async function testUserActivities() {
  console.log('🧪 Testing user-related activities...');
  
  try {
    await ActivityLogger.logUserRegistration(mockData.userId, mockData.userEmail, mockData.userName);
    console.log('✅ User registration activity logged');
    
    await ActivityLogger.logUserUpdate(mockData.userId, mockData.userEmail, ['displayName', 'email']);
    console.log('✅ User update activity logged');
    
  } catch (error) {
    console.error('❌ User activities test failed:', error);
  }
}

async function testProductActivities() {
  console.log('🧪 Testing product-related activities...');
  
  try {
    await ActivityLogger.logProductCreation(mockData.productId, mockData.productName, mockData.userId);
    console.log('✅ Product creation activity logged');
    
    await ActivityLogger.logProductUpdate(mockData.productId, mockData.productName, mockData.userId, ['price', 'description']);
    console.log('✅ Product update activity logged');
    
    await ActivityLogger.logProductDeletion(mockData.productId, mockData.productName, mockData.userId);
    console.log('✅ Product deletion activity logged');
    
  } catch (error) {
    console.error('❌ Product activities test failed:', error);
  }
}

async function testCategoryActivities() {
  console.log('🧪 Testing category-related activities...');
  
  try {
    await ActivityLogger.logCategoryCreation(mockData.categoryId, mockData.categoryName, mockData.userId);
    console.log('✅ Category creation activity logged');
    
    await ActivityLogger.logCategoryUpdate(mockData.categoryId, mockData.categoryName, mockData.userId, ['name', 'description']);
    console.log('✅ Category update activity logged');
    
    await ActivityLogger.logCategoryDeletion(mockData.categoryId, mockData.categoryName, mockData.userId);
    console.log('✅ Category deletion activity logged');
    
  } catch (error) {
    console.error('❌ Category activities test failed:', error);
  }
}

async function testColorActivities() {
  console.log('🧪 Testing color-related activities...');
  
  try {
    await ActivityLogger.logColorCreation(mockData.colorId, mockData.colorName, mockData.userId);
    console.log('✅ Color creation activity logged');
    
    await ActivityLogger.logColorUpdate(mockData.colorId, mockData.colorName, mockData.userId, ['hexCode', 'rgbCode']);
    console.log('✅ Color update activity logged');
    
    await ActivityLogger.logColorDeletion(mockData.colorId, mockData.colorName, mockData.userId);
    console.log('✅ Color deletion activity logged');
    
  } catch (error) {
    console.error('❌ Color activities test failed:', error);
  }
}

async function testOrderActivities() {
  console.log('🧪 Testing order-related activities...');
  
  try {
    await ActivityLogger.logOrderCreation(mockData.orderId, mockData.orderNumber, mockData.userId, 29.99);
    console.log('✅ Order creation activity logged');
    
    await ActivityLogger.logOrderUpdate(mockData.orderId, mockData.orderNumber, mockData.userId, 'processing');
    console.log('✅ Order update activity logged');
    
    await ActivityLogger.logOrderCompletion(mockData.orderId, mockData.orderNumber, mockData.userId);
    console.log('✅ Order completion activity logged');
    
    await ActivityLogger.logOrderCancellation(mockData.orderId, mockData.orderNumber, mockData.userId, 'Customer request');
    console.log('✅ Order cancellation activity logged');
    
  } catch (error) {
    console.error('❌ Order activities test failed:', error);
  }
}

async function testDesignActivities() {
  console.log('🧪 Testing design-related activities...');
  
  try {
    await ActivityLogger.logDesignCreation(mockData.designId, mockData.designName, mockData.designerId);
    console.log('✅ Design creation activity logged');
    
    await ActivityLogger.logDesignPublishing(mockData.designId, mockData.designName, mockData.designerId);
    console.log('✅ Design publishing activity logged');
    
  } catch (error) {
    console.error('❌ Design activities test failed:', error);
  }
}

async function testProfileActivities() {
  console.log('🧪 Testing profile-related activities...');
  
  try {
    await ActivityLogger.logShopProfileCreation(mockData.shopId, mockData.shopName, mockData.userId);
    console.log('✅ Shop profile creation activity logged');
    
    await ActivityLogger.logDesignerProfileCreation(mockData.designerId, mockData.designerName, mockData.userId);
    console.log('✅ Designer profile creation activity logged');
    
  } catch (error) {
    console.error('❌ Profile activities test failed:', error);
  }
}

async function testAdminActivities() {
  console.log('🧪 Testing admin-related activities...');
  
  try {
    await ActivityLogger.logAdminAction('System maintenance', mockData.adminId, mockData.productId, 'product', mockData.productName);
    console.log('✅ Admin action activity logged');
    
    await ActivityLogger.logSystemEvent('Database backup completed', { 
      backupSize: '2.5GB', 
      duration: '15 minutes' 
    });
    console.log('✅ System event activity logged');
    
  } catch (error) {
    console.error('❌ Admin activities test failed:', error);
  }
}

async function testCustomActivity() {
  console.log('🧪 Testing custom activity logging...');
  
  try {
    await ActivityLogger.logActivity({
      type: 'system_event',
      title: 'Custom Test Event',
      description: 'This is a custom test event for integration testing',
      priority: 'medium',
      metadata: {
        testType: 'integration',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Custom activity logged');
    
  } catch (error) {
    console.error('❌ Custom activity test failed:', error);
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Activity Logger Integration Tests...\n');
  
  try {
    await testUserActivities();
    await testProductActivities();
    await testCategoryActivities();
    await testColorActivities();
    await testOrderActivities();
    await testDesignActivities();
    await testProfileActivities();
    await testAdminActivities();
    await testCustomActivity();
    
    console.log('\n🎉 All integration tests completed!');
    console.log('Check your admin dashboard to see the logged activities.');
    
  } catch (error) {
    console.error('❌ Integration test runner error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  testUserActivities,
  testProductActivities,
  testCategoryActivities,
  testColorActivities,
  testOrderActivities,
  testDesignActivities,
  testProfileActivities,
  testAdminActivities,
  testCustomActivity
};

