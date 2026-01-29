const fs = require('fs');
const path = require('path');
const pool = require('./models/database');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    const migrationFile = path.join(__dirname, '../migrations/000_init_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't exit - let the app continue even if migrations fail (tables might already exist)
  }
}

module.exports = runMigrations;
