// Test script to verify pagination total count fix
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Pagination Total Count Fix...');

async function testPaginationTotalFix() {
  try {
    console.log('1. Testing pagination with correct total count...');
    
    // Test with 10 activities per page
    console.log('Testing 10 activities per page:');
    const response10 = await fetch('/api/activities?limit=10&offset=0');
    const data10 = await response10.json();
    
    if (response10.ok) {
      console.log('✅ Page 1 (10 per page):');
      console.log('- Activities returned:', data10.activities.length);
      console.log('- Total activities:', data10.pagination.total);
      console.log('- Has more:', data10.pagination.hasMore);
      console.log('- Should show: "Showing 1 to 10 of', data10.pagination.total, 'activities"');
      
      if (data10.pagination.hasMore) {
        console.log('\n2. Testing second page...');
        const response20 = await fetch('/api/activities?limit=10&offset=10');
        const data20 = await response20.json();
        
        if (response20.ok) {
          console.log('✅ Page 2 (10 per page):');
          console.log('- Activities returned:', data20.activities.length);
          console.log('- Total activities:', data20.pagination.total);
          console.log('- Has more:', data20.pagination.hasMore);
          console.log('- Should show: "Showing 11 to', Math.min(20, data20.pagination.total), 'of', data20.pagination.total, 'activities"');
        }
      }
    }
    
    // Test with 20 activities per page
    console.log('\n3. Testing 20 activities per page:');
    const response20 = await fetch('/api/activities?limit=20&offset=0');
    const data20 = await response20.json();
    
    if (response20.ok) {
      console.log('✅ 20 per page:');
      console.log('- Activities returned:', data20.activities.length);
      console.log('- Total activities:', data20.pagination.total);
      console.log('- Has more:', data20.pagination.hasMore);
    }
    
    // Test with 100 activities per page (should show all)
    console.log('\n4. Testing 100 activities per page:');
    const response100 = await fetch('/api/activities?limit=100&offset=0');
    const data100 = await response100.json();
    
    if (response100.ok) {
      console.log('✅ 100 per page:');
      console.log('- Activities returned:', data100.activities.length);
      console.log('- Total activities:', data100.pagination.total);
      console.log('- Has more:', data100.pagination.hasMore);
      console.log('- Should show all', data100.pagination.total, 'activities');
    }
    
    console.log('\n5. Navigate to /dashboard/admin/activities');
    console.log('The pagination should now work correctly:');
    console.log('- Total count should be accurate (22 activities)');
    console.log('- Next button should be enabled when there are more pages');
    console.log('- Pagination info should show correct ranges');
    console.log('- Page numbers should reflect the actual total');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testPaginationTotalFix = testPaginationTotalFix;

console.log('Test function loaded! Use:');
console.log('- testPaginationTotalFix() - Test pagination total count fix');

// Auto-run the test
testPaginationTotalFix();
