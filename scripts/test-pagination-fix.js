// Quick test to verify pagination fix
// Run this in your browser console while logged in as admin

console.log('🧪 Testing Pagination Fix...');

async function testPaginationFix() {
  try {
    console.log('1. Testing pagination logic...');
    
    // Test with 10 activities per page
    const response = await fetch('/api/activities?limit=10&offset=0');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response:');
      console.log('- Activities returned:', data.activities.length);
      console.log('- Total activities:', data.pagination.total);
      console.log('- Has more:', data.pagination.hasMore);
      console.log('- Limit:', data.pagination.limit);
      console.log('- Offset:', data.pagination.offset);
      
      // Test second page if there are more activities
      if (data.pagination.hasMore) {
        console.log('\n2. Testing second page...');
        const page2Response = await fetch('/api/activities?limit=10&offset=10');
        const page2Data = await page2Response.json();
        
        if (page2Response.ok) {
          console.log('✅ Page 2 Response:');
          console.log('- Activities returned:', page2Data.activities.length);
          console.log('- Total activities:', page2Data.pagination.total);
          console.log('- Has more:', page2Data.pagination.hasMore);
        }
      } else {
        console.log('\n2. No second page available (only', data.pagination.total, 'total activities)');
        console.log('Create more activities to test pagination properly');
      }
      
      console.log('\n3. Navigate to /dashboard/admin/activities');
      console.log('The pagination should now work correctly:');
      console.log('- Next button should be enabled if there are more pages');
      console.log('- Page numbers should show correctly');
      console.log('- Pagination info should be accurate');
      
    } else {
      console.error('❌ API Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Export function
window.testPaginationFix = testPaginationFix;

console.log('Test function loaded! Use:');
console.log('- testPaginationFix() - Test pagination fix');

// Auto-run the test
testPaginationFix();

