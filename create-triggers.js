const mysql = require('mysql2/promise');

async function createTriggers() {
  console.log('Creating MySQL triggers...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password
      database: 'fabriqly',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL\n');

    // Drop existing triggers
    console.log('Dropping existing triggers (if any)...');
    await connection.query('DROP TRIGGER IF EXISTS trigger_update_user_role_designer');
    await connection.query('DROP TRIGGER IF EXISTS trigger_update_user_role_shop');
    console.log('✅ Old triggers removed\n');

    // Create designer application trigger
    console.log('Creating designer application trigger...');
    const designerTrigger = `
      CREATE TRIGGER trigger_update_user_role_designer
      AFTER UPDATE ON designer_applications
      FOR EACH ROW
      BEGIN
          IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
              UPDATE users SET role = 'designer', updated_at = NOW() WHERE id = NEW.user_id;
          ELSEIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
              UPDATE users SET role = 'customer', updated_at = NOW() WHERE id = NEW.user_id;
          END IF;
      END
    `;
    await connection.query(designerTrigger);
    console.log('✅ Designer trigger created\n');

    // Create shop application trigger
    console.log('Creating shop application trigger...');
    const shopTrigger = `
      CREATE TRIGGER trigger_update_user_role_shop
      AFTER UPDATE ON shop_applications
      FOR EACH ROW
      BEGIN
          IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
              UPDATE users SET role = 'business_owner', updated_at = NOW() WHERE id = NEW.user_id;
          ELSEIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
              UPDATE users SET role = 'customer', updated_at = NOW() WHERE id = NEW.user_id;
          END IF;
      END
    `;
    await connection.query(shopTrigger);
    console.log('✅ Shop trigger created\n');

    // Verify triggers were created
    const [triggers] = await connection.execute('SHOW TRIGGERS');
    console.log(`✅ Total triggers: ${triggers.length}`);
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.Trigger} on ${trigger.Table}`);
    });

    await connection.end();
    console.log('\n✅ All triggers created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTriggers();

