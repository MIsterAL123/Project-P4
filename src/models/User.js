// Model untuk tabel users
const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  // Create new user
  static async create(userData) {
    const { nama, email, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    
    const sql = 'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)';
    const result = await query(sql, [nama, email, hashedPassword, role]);
    
    return {
      id: result.insertId,
      nama,
      email,
      role
    };
  }

  // Update user
  static async update(id, userData) {
    const { nama, email } = userData;
    const sql = 'UPDATE users SET nama = ?, email = ? WHERE id = ?';
    await query(sql, [nama, email, id]);
    return this.findById(id);
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const sql = 'UPDATE users SET password = ? WHERE id = ?';
    await query(sql, [hashedPassword, id]);
    return true;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Delete user
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  // Get all users by role
  static async findByRole(role) {
    const sql = 'SELECT id, nama, email, role, created_at FROM users WHERE role = ?';
    return query(sql, [role]);
  }

  // Count users by role
  static async countByRole(role) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE role = ?';
    const results = await query(sql, [role]);
    return results[0].count;
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let sql = 'SELECT id FROM users WHERE email = ?';
    const params = [email];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await query(sql, params);
    return results.length > 0;
  }
}

module.exports = User;