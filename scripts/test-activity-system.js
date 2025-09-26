// Test script to generate sample activities for testing
// Run this in your browser console or as a Node.js script

const testActivities = [
  {
    type: 'user_registered',
    title: 'User Registration',
    description: 'New user registered: test@example.com',
    priority: 'medium',
    actorId: 'test-user-1',
    targetId: 'test-user-1',
    targetType: 'user',
    targetName: 'test@example.com',
    metadata: {
      email: 'test@example.com',
      registrationMethod: 'email'
    }
  },
  {
    type: 'product_created',
    title: 'Product Created',
    description: 'New product created: Test T-Shirt',
    priority: 'medium',
    actorId: 'test-user-1',
    targetId: 'test-product-1',
    targetType: 'product',
    targetName: 'Test T-Shirt',
    metadata: {
      productName: 'Test T-Shirt',
      creatorId: 'test-user-1'
    }
  },
  {
    type: 'category_created',
    title: 'Category Created',
    description: 'New category created: Test Category',
    priority: 'medium',
    actorId: 'test-user-1',
    targetId: 'test-category-1',
    targetType: 'category',
    targetName: 'Test Category',
    metadata: {
      categoryName: 'Test Category',
      creatorId: 'test-user-1'
    }
  },
  {
    type: 'color_created',
    title: 'Color Created',
    description: 'New color added: Test Red',
    priority: 'low',
    actorId: 'test-user-1',
    targetId: 'test-color-1',
    targetType: 'color',
    targetName: 'Test Red',
    metadata: {
      colorName: 'Test Red',
      creatorId: 'test-user-1'
    }
  },
  {
    type: 'order_created',
    title: 'Order Created',
    description: 'New order placed: #ORD-001',
    priority: 'high',
    actorId: 'test-user-1',
    targetId: 'test-order-1',
    targetType: 'order',
    targetName: '#ORD-001',
    metadata: {
      orderNumber: '#ORD-001',
      customerId: 'test-user-1',
      totalAmount: 29.99
    }
  },
  {
    type: 'admin_action',
    title: 'Admin Action',
    description: 'Admin action: System maintenance performed',
    priority: 'high',
    actorId: 'admin-user-1',
    metadata: {
      action: 'System maintenance performed',
      adminId: 'admin-user-1'
    }
  }
];

// Function to create test activities
async function createTestActivities() {
  console.log('Creating test activities...');
  
  for (const activity of testActivities) {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Created activity:', result.activity.title);
      } else {
        const error = await response.json();
        console.error('❌ Failed to create activity:', error);
      }
    } catch (error) {
      console.error('❌ Error creating activity:', error);
    }
  }
  
  console.log('Test activities creation completed!');
}

// Function to test activity API endpoints
async function testActivityAPI() {
  console.log('Testing Activity API endpoints...');
  
  try {
    // Test GET /api/activities
    console.log('1. Testing GET /api/activities...');
    const listResponse = await fetch('/api/activities?limit=10');
    const listData = await listResponse.json();
    
    if (listResponse.ok) {
      console.log('✅ GET /api/activities successful:', listData.activities.length, 'activities');
    } else {
      console.error('❌ GET /api/activities failed:', listData.error);
    }
    
    // Test GET /api/activities/stats
    console.log('2. Testing GET /api/activities/stats...');
    const statsResponse = await fetch('/api/activities/stats');
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ GET /api/activities/stats successful:', statsData.stats);
    } else {
      console.error('❌ GET /api/activities/stats failed:', statsData.error);
    }
    
    // Test filtering
    console.log('3. Testing activity filtering...');
    const filterResponse = await fetch('/api/activities?types=user_registered,product_created&priority=medium,high');
    const filterData = await filterResponse.json();
    
    if (filterResponse.ok) {
      console.log('✅ Activity filtering successful:', filterData.activities.length, 'filtered activities');
    } else {
      console.error('❌ Activity filtering failed:', filterData.error);
    }
    
  } catch (error) {
    console.error('❌ API testing error:', error);
  }
}

// Function to clear test activities
async function clearTestActivities() {
  console.log('Clearing test activities...');
  
  try {
    // Get all activities
    const response = await fetch('/api/activities?limit=100');
    const data = await response.json();
    
    if (response.ok) {
      // Delete test activities (those with test- prefix in IDs)
      for (const activity of data.activities) {
        if (activity.id.startsWith('test-') || activity.targetId?.startsWith('test-')) {
          const deleteResponse = await fetch(`/api/activities/${activity.id}`, {
            method: 'DELETE'
          });
          
          if (deleteResponse.ok) {
            console.log('✅ Deleted test activity:', activity.title);
          } else {
            console.error('❌ Failed to delete activity:', activity.id);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error clearing test activities:', error);
  }
}

// Export functions for use
window.testActivitySystem = {
  createTestActivities,
  testActivityAPI,
  clearTestActivities
};

console.log('Test functions loaded! Use:');
console.log('- testActivitySystem.createTestActivities()');
console.log('- testActivitySystem.testActivityAPI()');
console.log('- testActivitySystem.clearTestActivities()');

