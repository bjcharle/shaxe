const fs = require('fs');
const path = require('path');
const pool = require('./models/database');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    // Check if migrations already ran
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('⚠️ Tables already exist - skipping migration');
      
      // List all tables for verification
      const allTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      console.log('📋 Existing tables:', allTables.rows.map(r => r.table_name).join(', '));
      return;
    }
    
    const migrationFile = path.join(__dirname, '../migrations/000_init_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the entire migration in a transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migrations completed successfully - 11 tables created');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error.message);
    console.error('Full error:', error);
    // Don't exit - let the app continue
  } finally {
    client.release();
  }
}

module.exports = runMigrations;
