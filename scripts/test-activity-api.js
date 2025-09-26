// Automated tests for Activity API endpoints
// Run with: node scripts/test-activity-api.js

const BASE_URL = 'http://localhost:3000';

// Test data
const testActivity = {
  type: 'user_registered',
  title: 'Test User Registration',
  description: 'Test user registered: test@example.com',
  priority: 'medium',
  actorId: 'test-user-123',
  targetId: 'test-user-123',
  targetType: 'user',
  targetName: 'test@example.com',
  metadata: {
    email: 'test@example.com',
    registrationMethod: 'email'
  }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, success: response.ok };
  } catch (error) {
    return { error, success: false };
  }
}

// Test functions
async function testCreateActivity() {
  console.log('🧪 Testing POST /api/activities...');
  
  const result = await apiCall('/api/activities', {
    method: 'POST',
    body: JSON.stringify(testActivity)
  });
  
  if (result.success) {
    console.log('✅ Activity created successfully:', result.data.activity.title);
    return result.data.activity.id;
  } else {
    console.error('❌ Failed to create activity:', result.data?.error || result.error);
    return null;
  }
}

async function testGetActivities() {
  console.log('🧪 Testing GET /api/activities...');
  
  const result = await apiCall('/api/activities?limit=10');
  
  if (result.success) {
    console.log('✅ Activities retrieved successfully:', result.data.activities.length, 'activities');
    return result.data.activities;
  } else {
    console.error('❌ Failed to get activities:', result.data?.error || result.error);
    return [];
  }
}

async function testGetActivityById(activityId) {
  console.log('🧪 Testing GET /api/activities/[id]...');
  
  const result = await apiCall(`/api/activities/${activityId}`);
  
  if (result.success) {
    console.log('✅ Activity retrieved successfully:', result.data.activity.title);
    return result.data.activity;
  } else {
    console.error('❌ Failed to get activity by ID:', result.data?.error || result.error);
    return null;
  }
}

async function testUpdateActivity(activityId) {
  console.log('🧪 Testing PUT /api/activities/[id]...');
  
  const updateData = {
    title: 'Updated Test Activity',
    description: 'This activity has been updated for testing',
    priority: 'high'
  };
  
  const result = await apiCall(`/api/activities/${activityId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
  
  if (result.success) {
    console.log('✅ Activity updated successfully:', result.data.activity.title);
    return result.data.activity;
  } else {
    console.error('❌ Failed to update activity:', result.data?.error || result.error);
    return null;
  }
}

async function testDeleteActivity(activityId) {
  console.log('🧪 Testing DELETE /api/activities/[id]...');
  
  const result = await apiCall(`/api/activities/${activityId}`, {
    method: 'DELETE'
  });
  
  if (result.success) {
    console.log('✅ Activity deleted successfully');
    return true;
  } else {
    console.error('❌ Failed to delete activity:', result.data?.error || result.error);
    return false;
  }
}

async function testGetActivityStats() {
  console.log('🧪 Testing GET /api/activities/stats...');
  
  const result = await apiCall('/api/activities/stats');
  
  if (result.success) {
    console.log('✅ Activity stats retrieved successfully:', result.data.stats);
    return result.data.stats;
  } else {
    console.error('❌ Failed to get activity stats:', result.data?.error || result.error);
    return null;
  }
}

async function testActivityFiltering() {
  console.log('🧪 Testing activity filtering...');
  
  const filters = [
    '?types=user_registered,product_created',
    '?priority=medium,high',
    '?status=active',
    '?limit=5&offset=0',
    '?sortBy=createdAt&sortOrder=desc'
  ];
  
  for (const filter of filters) {
    const result = await apiCall(`/api/activities${filter}`);
    
    if (result.success) {
      console.log(`✅ Filter test passed: ${filter}`, result.data.activities.length, 'activities');
    } else {
      console.error(`❌ Filter test failed: ${filter}`, result.data?.error || result.error);
    }
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  // Test invalid activity creation
  const invalidActivity = {
    type: 'invalid_type',
    title: '', // Empty title should fail
    description: 'Test'
  };
  
  const result = await apiCall('/api/activities', {
    method: 'POST',
    body: JSON.stringify(invalidActivity)
  });
  
  if (!result.success) {
    console.log('✅ Error handling works correctly:', result.data?.error);
  } else {
    console.error('❌ Error handling failed: Should have rejected invalid activity');
  }
  
  // Test non-existent activity
  const nonExistentResult = await apiCall('/api/activities/non-existent-id');
  
  if (!nonExistentResult.success) {
    console.log('✅ Non-existent activity handling works correctly');
  } else {
    console.error('❌ Non-existent activity handling failed');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Activity API Tests...\n');
  
  try {
    // Test activity creation
    const activityId = await testCreateActivity();
    
    if (activityId) {
      // Test getting activities
      await testGetActivities();
      
      // Test getting activity by ID
      await testGetActivityById(activityId);
      
      // Test updating activity
      await testUpdateActivity(activityId);
      
      // Test activity stats
      await testGetActivityStats();
      
      // Test filtering
      await testActivityFiltering();
      
      // Test error handling
      await testErrorHandling();
      
      // Test deletion
      await testDeleteActivity(activityId);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testCreateActivity,
  testGetActivities,
  testGetActivityById,
  testUpdateActivity,
  testDeleteActivity,
  testGetActivityStats,
  testActivityFiltering,
  testErrorHandling
};

