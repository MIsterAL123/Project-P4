// Model untuk tabel admin
const { query } = require('../config/database');
const User = require('./User');

class Admin {
  // Find admin by ID
  static async findById(id) {
    const sql = `
      SELECT a.*, u.nama, u.email, u.role, u.created_at as user_created_at
      FROM admin a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find admin by user_id
  static async findByUserId(userId) {
    const sql = `
      SELECT a.*, u.nama, u.email, u.role
      FROM admin a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
    `;
    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  // Create admin (by another admin)
  static async create(userData, addedByAdminId = null) {
    const { nama, email, password, no_hp, is_active } = userData;
    
    // First create the user
    const user = await User.create({
      nama,
      email,
      password,
      role: 'admin'
    });

    // Then create admin record with additional fields
    const sql = 'INSERT INTO admin (user_id, added_by, no_hp, is_active) VALUES (?, ?, ?, ?)';
    const result = await query(sql, [user.id, addedByAdminId, no_hp || null, is_active !== undefined ? is_active : 1]);

    return {
      id: result.insertId,
      user_id: user.id,
      nama: user.nama,
      email: user.email,
      no_hp: no_hp || null,
      is_active: is_active !== undefined ? is_active : 1,
      added_by: addedByAdminId
    };
  }

  // Get all admins
  static async findAll() {
    const sql = `
      SELECT a.id, a.user_id, a.added_by, a.no_hp, a.is_active, a.created_at,
             u.nama, u.email,
             adder.id as adder_admin_id,
             adder_user.nama as added_by_name
      FROM admin a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN admin adder ON a.added_by = adder.id
      LEFT JOIN users adder_user ON adder.user_id = adder_user.id
      ORDER BY a.created_at DESC
    `;
    return query(sql);
  }

  // Count total admins
  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM admin';
    const results = await query(sql);
    return results[0].count;
  }

  // Update admin
  static async update(id, adminData) {
    const { nama, email, no_hp, is_active } = adminData;
    const admin = await this.findById(id);
    
    if (!admin) return null;

    // Update user data
    await User.update(admin.user_id, { nama, email });
    
    // Update admin specific data if provided
    if (no_hp !== undefined || is_active !== undefined) {
      let sql = 'UPDATE admin SET';
      const params = [];
      const updates = [];
      
      if (no_hp !== undefined) {
        updates.push(' no_hp = ?');
        params.push(no_hp);
      }
      if (is_active !== undefined) {
        updates.push(' is_active = ?');
        params.push(is_active);
      }
      
      if (updates.length > 0) {
        sql += updates.join(',') + ' WHERE id = ?';
        params.push(id);
        await query(sql, params);
      }
    }
    
    return this.findById(id);
  }

  // Delete admin
  static async delete(id) {
    const admin = await this.findById(id);
    if (admin) {
      await User.delete(admin.user_id);
    }
    return true;
  }
}

module.exports = Admin;