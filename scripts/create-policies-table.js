/**
 * Create policies table in MySQL database
 * Run this script to set up the policies table
 * 
 * Usage: node scripts/create-policies-table.js
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPoliciesTable() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'fabriqly',
      multipleStatements: true
    });
    
    console.log('Connected to database');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', 'create_policies_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await connection.query(sql);
    
    console.log('✅ Policies table created successfully!');
    
    // Verify table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'policies'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Verified: policies table exists');
      
      // Show table structure
      const [structure] = await connection.query('DESCRIBE policies');
      console.log('\nTable structure:');
      console.table(structure);
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Policies table already exists. Skipping creation.');
    } else {
      console.error('❌ Error creating policies table:', error.message);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
createPoliciesTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now run: node scripts/seed-policies.js');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

