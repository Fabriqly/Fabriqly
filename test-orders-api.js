// Test script to verify orders API works
const testOrdersAPI = async () => {
  try {
    console.log('Testing orders API...');
    
    // Test the orders endpoint
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Orders API working!');
      console.log('Orders count:', data.orders?.length || 0);
      console.log('Total revenue:', data.totalRevenue || 0);
    } else {
      const error = await response.text();
      console.log('❌ Orders API failed:', response.status, error);
    }
  } catch (error) {
    console.log('❌ Error testing orders API:', error.message);
  }
};

// Run the test
testOrdersAPI();
