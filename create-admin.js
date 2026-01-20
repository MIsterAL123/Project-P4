// Script untuk membuat admin pertama
const bcrypt = require('bcryptjs');
const { query } = require('./src/config/database');

async function createAdminAccount() {
  try {
    // Data admin
    const adminData = {
      nama: 'Super Admin',
      email: 'admin@p4jakarta.go.id',
      password: 'admin123456' // Ganti dengan password yang kuat
    };

    console.log('Creating admin account...');

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Insert user record
    const userSql = 'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)';
    const userResult = await query(userSql, [
      adminData.nama,
      adminData.email,
      hashedPassword,
      'admin'
    ]);

    const userId = userResult.insertId;

    // Insert admin record
    const adminSql = 'INSERT INTO admin (user_id, added_by) VALUES (?, ?)';
    const adminResult = await query(adminSql, [userId, null]);

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('❌ Admin with this email already exists!');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    process.exit(1);
  }
}

createAdminAccount();