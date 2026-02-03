// Script to update pendaftaran_p4 status enum
// Run this to fix: "Gagal memperbarui status pendaftaran" error

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function updateStatusEnum() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'P4',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database:', process.env.DB_NAME || 'P4');
    
    // Read and execute migration
    const migrationPath = path.join(__dirname, 'database', 'migrations', '011_update_pendaftaran_p4_status.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('\n🔄 Updating pendaftaran_p4.status column...');
    console.log('   Current: ENUM(\'registered\', \'cancelled\')');
    console.log('   New:     ENUM(\'pending\', \'approved\', \'rejected\', \'registered\', \'cancelled\')');
    
    await connection.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Status pendaftaran sekarang bisa diubah ke:');
    console.log('   - pending (Menunggu Approval)');
    console.log('   - approved (Disetujui)');
    console.log('   - rejected (Ditolak)');
    console.log('   - registered (Terdaftar)');
    console.log('   - cancelled (Dibatalkan)');
    console.log('\n✅ Error "Gagal memperbarui status pendaftaran" sudah diperbaiki!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Pastikan MySQL server sedang berjalan');
    console.error('2. Periksa file .env untuk DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('3. Pastikan user database memiliki privilege ALTER TABLE');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

updateStatusEnum();
