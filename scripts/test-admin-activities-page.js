// Test script to verify admin activities page works correctly
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Admin Activities Page...');

async function testAdminActivitiesPage() {
  try {
    console.log('1. Testing activities API endpoint...');
    
    const response = await fetch('/api/activities?limit=10');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Activities API working:', data.activities.length, 'activities found');
      
      // Check for new activity types
      const activityTypes = [...new Set(data.activities.map(a => a.type))];
      console.log('Activity types found:', activityTypes);
      
      const newTypes = ['product_published', 'product_unpublished', 'product_republished'];
      const foundNewTypes = newTypes.filter(type => activityTypes.includes(type));
      
      if (foundNewTypes.length > 0) {
        console.log('✅ New product publishing activity types found:', foundNewTypes);
      } else {
        console.log('ℹ️ No new product publishing activities yet (create some to test)');
      }
      
      console.log('\n2. Testing admin activities page...');
      console.log('Navigate to: /dashboard/admin/activities');
      console.log('The page should now load without errors');
      
      console.log('\n3. Expected activity types in the page:');
      console.log('- product_published (Send icon)');
      console.log('- product_unpublished (EyeOff icon)');
      console.log('- product_republished (Eye icon)');
      
    } else {
      console.error('❌ Activities API failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testAdminActivitiesPage = testAdminActivitiesPage;

console.log('Test function loaded! Use:');
console.log('- testAdminActivitiesPage() - Test admin activities page');

// Auto-run the test
testAdminActivitiesPage();
