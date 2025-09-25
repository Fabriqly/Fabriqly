// Browser console test for Activity API
// Run this in your browser console while on localhost:3000

console.log('🚀 Starting Activity API Browser Tests...');

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
    const response = await fetch(endpoint, {
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
    console.log('✅ Activity created successfully!');
    console.log('Activity data:', result.data);
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
    console.log('✅ Activities retrieved successfully!');
    console.log('Number of activities:', result.data.activities.length);
    console.log('Activities:', result.data.activities);
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
    console.log('✅ Activity retrieved successfully!');
    console.log('Activity:', result.data.activity);
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
    console.log('✅ Activity updated successfully!');
    console.log('Updated activity:', result.data.activity);
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
    console.log('✅ Activity deleted successfully!');
    return true;
  } else {
    console.error('❌ Failed to delete activity:', result.data?.error || result.error);
    return false;
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
      
      // Test deletion
      await testDeleteActivity(activityId);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
}

// Export functions for manual testing
window.testActivityAPI = {
  runAllTests,
  testCreateActivity,
  testGetActivities,
  testGetActivityById,
  testUpdateActivity,
  testDeleteActivity
};

console.log('Test functions loaded! Use:');
console.log('- testActivityAPI.runAllTests()');
console.log('- testActivityAPI.testCreateActivity()');
console.log('- testActivityAPI.testGetActivities()');
console.log('- testActivityAPI.testGetActivityById(id)');
console.log('- testActivityAPI.testUpdateActivity(id)');
console.log('- testActivityAPI.testDeleteActivity(id)');

// Auto-run tests
runAllTests();
