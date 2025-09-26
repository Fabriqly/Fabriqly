// Test script to verify pagination functionality
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Activities Pagination...');

async function testActivitiesPagination() {
  try {
    console.log('1. Testing pagination with different page sizes...');
    
    // Test with 10 activities per page
    console.log('Testing 10 activities per page:');
    const response10 = await fetch('/api/activities?limit=10&offset=0');
    const data10 = await response10.json();
    
    if (response10.ok) {
      console.log('✅ 10 activities per page:', data10.activities.length, 'activities');
      console.log('Total activities:', data10.pagination?.total || 'Unknown');
      console.log('Has more:', data10.pagination?.hasMore || false);
    }
    
    // Test with 20 activities per page
    console.log('\nTesting 20 activities per page:');
    const response20 = await fetch('/api/activities?limit=20&offset=0');
    const data20 = await response20.json();
    
    if (response20.ok) {
      console.log('✅ 20 activities per page:', data20.activities.length, 'activities');
      console.log('Total activities:', data20.pagination?.total || 'Unknown');
      console.log('Has more:', data20.pagination?.hasMore || false);
    }
    
    // Test second page
    console.log('\nTesting second page (offset 20):');
    const responsePage2 = await fetch('/api/activities?limit=20&offset=20');
    const dataPage2 = await responsePage2.json();
    
    if (responsePage2.ok) {
      console.log('✅ Page 2:', dataPage2.activities.length, 'activities');
      console.log('Total activities:', dataPage2.pagination?.total || 'Unknown');
    }
    
    console.log('\n2. Navigate to /dashboard/admin/activities');
    console.log('You should now see:');
    console.log('- Page size selector (10, 20, 50, 100)');
    console.log('- Previous/Next buttons');
    console.log('- Page numbers (1, 2, 3, etc.)');
    console.log('- Pagination info showing "Showing X to Y of Z activities"');
    
    console.log('\n3. Test the pagination controls:');
    console.log('- Change page size and verify it updates');
    console.log('- Click Previous/Next buttons');
    console.log('- Click page numbers');
    console.log('- Verify the activities list updates correctly');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testActivitiesPagination = testActivitiesPagination;

console.log('Test function loaded! Use:');
console.log('- testActivitiesPagination() - Test pagination functionality');

// Auto-run the test
testActivitiesPagination();

