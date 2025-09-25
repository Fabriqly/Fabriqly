// Test script to verify user registration activity logging
// Run this in your browser console

console.log('🧪 Testing User Registration Activity Logging...');

async function testUserRegistrationActivity() {
  try {
    console.log('1. Registering a test user...');
    
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'customer'
    };

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test user registered successfully:', data.user.email);
      
      // Wait a moment for the activity to be logged
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('2. Checking for user registration activity...');
      const activitiesResponse = await fetch('/api/activities?limit=5');
      const activitiesData = await activitiesResponse.json();
      
      if (activitiesResponse.ok) {
        const registrationActivity = activitiesData.activities.find(
          activity => activity.type === 'user_registered' && activity.targetId === data.user.uid
        );
        
        if (registrationActivity) {
          console.log('✅ User registration activity logged:', registrationActivity.title);
          console.log('Activity details:', registrationActivity);
          console.log('🎉 User registration activity logging is working!');
        } else {
          console.log('⚠️ User registration activity not found');
          console.log('Recent activities:', activitiesData.activities.map(a => ({ type: a.type, title: a.title })));
        }
      } else {
        console.error('❌ Failed to fetch activities:', activitiesData.error);
      }
      
    } else {
      console.error('❌ Failed to register test user:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test function to check all recent activities
async function checkAllRecentActivities() {
  try {
    console.log('📊 Checking all recent activities...');
    
    const response = await fetch('/api/activities?limit=20');
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.activities.length} recent activities:`);
      
      const activityTypes = {};
      data.activities.forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.title} - ${activity.type} (${activity.priority})`);
        console.log(`   Description: ${activity.description}`);
        console.log(`   Actor: ${activity.actor?.name || 'System'}`);
        console.log(`   Target: ${activity.target?.name || 'N/A'}`);
        console.log(`   Time: ${activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
        console.log('');
        
        // Count activity types
        activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
      });
      
      console.log('📈 Activity type summary:', activityTypes);
    } else {
      console.error('❌ Failed to fetch activities:', data.error);
    }
  } catch (error) {
    console.error('❌ Error checking activities:', error);
  }
}

// Export functions for manual testing
window.testUserRegistrationActivity = testUserRegistrationActivity;
window.checkAllRecentActivities = checkAllRecentActivities;

console.log('Test functions loaded! Use:');
console.log('- testUserRegistrationActivity()');
console.log('- checkAllRecentActivities()');

// Auto-run the check
checkAllRecentActivities();
