const { query } = require('../config/database');

class Material {
  static async create({ guru_id, title, description, file_path, file_type }) {
    const sql = `INSERT INTO materials (guru_id, title, description, file_path, file_type) VALUES (?, ?, ?, ?, ?)`;
    const result = await query(sql, [guru_id, title, description || null, file_path, file_type]);
    return {
      id: result.insertId,
      guru_id,
      title,
      description,
      file_path,
      file_type
    };
  }

  static async findByGuru(guru_id) {
    const sql = `SELECT m.*, u.nama as guru_nama FROM materials m JOIN guru g ON m.guru_id = g.id JOIN users u ON g.user_id = u.id WHERE guru_id = ? ORDER BY m.created_at DESC`;
    return query(sql, [guru_id]);
  }

  static async findById(id) {
    const sql = `SELECT * FROM materials WHERE id = ?`;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  static async findAll() {
    const sql = `SELECT m.*, u.nama as guru_nama FROM materials m LEFT JOIN guru g ON m.guru_id = g.id LEFT JOIN users u ON g.user_id = u.id ORDER BY m.created_at DESC`;
    return query(sql);
  }

  static async delete(id) {
    // delete row
    const sql = `DELETE FROM materials WHERE id = ?`;
    await query(sql, [id]);
    return true;
  }
}

module.exports = Material;