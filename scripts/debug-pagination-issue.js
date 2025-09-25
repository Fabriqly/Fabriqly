// Debug script to check what's happening with pagination
// Run this in your browser console while logged in as admin

console.log('🔍 Debugging Pagination Issue...');

async function debugPagination() {
  try {
    console.log('1. Testing API responses...');
    
    // Test with 10 per page
    const response10 = await fetch('/api/activities?limit=10&offset=0');
    const data10 = await response10.json();
    
    console.log('10 per page response:');
    console.log('- Activities returned:', data10.activities.length);
    console.log('- Pagination:', data10.pagination);
    
    // Test with 20 per page
    const response20 = await fetch('/api/activities?limit=20&offset=0');
    const data20 = await response20.json();
    
    console.log('\n20 per page response:');
    console.log('- Activities returned:', data20.activities.length);
    console.log('- Pagination:', data20.pagination);
    
    // Test with 100 per page
    const response100 = await fetch('/api/activities?limit=100&offset=0');
    const data100 = await response100.json();
    
    console.log('\n100 per page response:');
    console.log('- Activities returned:', data100.activities.length);
    console.log('- Pagination:', data100.pagination);
    
    console.log('\n2. Analysis:');
    console.log('- If all three show the same total, the API is working correctly');
    console.log('- If they show different totals, there might be a caching issue');
    console.log('- The total should be the same regardless of limit');
    
    // Check if there are any duplicate activities
    console.log('\n3. Checking for duplicate activities...');
    const allActivities = data100.activities;
    const activityIds = allActivities.map(a => a.id);
    const uniqueIds = [...new Set(activityIds)];
    
    console.log('- Total activities:', allActivities.length);
    console.log('- Unique IDs:', uniqueIds.length);
    console.log('- Duplicates found:', allActivities.length - uniqueIds.length);
    
    if (allActivities.length !== uniqueIds.length) {
      console.log('⚠️ DUPLICATE ACTIVITIES DETECTED!');
      console.log('This could be causing the pagination issue.');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Export function
window.debugPagination = debugPagination;

console.log('Debug function loaded! Use:');
console.log('- debugPagination() - Debug pagination issue');

// Auto-run the debug
debugPagination();
