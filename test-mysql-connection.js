const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password from your .env
      database: 'fabriqly'
    });

    console.log('✅ Connected to MySQL successfully!\n');

    // Test 1: Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Test 2: Count records
    console.log('\n📊 Record counts:');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [designerApps] = await connection.execute('SELECT COUNT(*) as count FROM designer_applications');
    const [shopApps] = await connection.execute('SELECT COUNT(*) as count FROM shop_applications');
    
    console.log(`   - Users: ${users[0].count}`);
    console.log(`   - Designer Applications: ${designerApps[0].count}`);
    console.log(`   - Shop Applications: ${shopApps[0].count}`);

    // Test 3: Check triggers
    console.log('\n🔧 Checking triggers:');
    const [triggers] = await connection.execute('SHOW TRIGGERS');
    console.log(`   - Found ${triggers.length} triggers`);
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.Trigger} on ${trigger.Table}`);
    });

    await connection.end();
    console.log('\n✅ All tests passed! MySQL is working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MySQL is running');
    console.error('2. Verify password in .env.local');
    console.error('3. Ensure database "fabriqly" exists');
    process.exit(1);
  }
}

testConnection();

