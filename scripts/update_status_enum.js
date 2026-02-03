// Script to update pendaftaran_p4 status enum
require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateStatusEnum() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'P4'
  });

  try {
    console.log('Checking current status enum...');
    
    // Check current enum
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM pendaftaran_p4 WHERE Field = 'status'"
    );
    console.log('Current status column:', columns[0]);
    
    // Update enum to include all statuses
    console.log('Updating status enum...');
    await connection.execute(`
      ALTER TABLE pendaftaran_p4 
      MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'registered', 'cancelled') DEFAULT 'registered'
    `);
    
    console.log('✅ Status enum updated successfully!');
    
    // Verify the change
    const [newColumns] = await connection.execute(
      "SHOW COLUMNS FROM pendaftaran_p4 WHERE Field = 'status'"
    );
    console.log('New status column:', newColumns[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

updateStatusEnum();
