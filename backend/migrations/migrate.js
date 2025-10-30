const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function executeStatement(statement) {
  try {
    await pool.execute(statement);
  } catch (error) {
    // Ignore duplicate index errors and duplicate entry errors
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY') {
      console.log(`⚠️  Skipping: ${error.message}`);
      return;
    }
    // Ignore table already exists errors
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log(`⚠️  Table already exists: ${error.message}`);
      return;
    }
    // Re-throw other errors
    throw error;
  }
}

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '01_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeStatement(statement);
      }
    }
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

