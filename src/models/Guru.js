// Model untuk tabel guru
const { query } = require('../config/database');
const User = require('./User');

class Guru {
  // Find guru by ID
  static async findById(id) {
    const sql = `
      SELECT g.*, u.nama, u.email, u.role, u.created_at as user_created_at,
             verifier.nama as verified_by_name
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN admin a ON g.verified_by = a.id
      LEFT JOIN users verifier ON a.user_id = verifier.id
      WHERE g.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find guru by user_id
  static async findByUserId(userId) {
    const sql = `
      SELECT g.id, g.user_id, g.nip, g.link_dokumen, g.no_hp, g.sekolah_asal, g.mata_pelajaran, 
             g.status, g.verified_by, g.verified_at, g.rejection_reason, g.created_at, g.updated_at,
             u.nama, u.email, u.role
      FROM guru g
      JOIN users u ON g.user_id = u.id
      WHERE g.user_id = ?
    `;
    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  // Find guru by NIP
  static async findByNip(nip) {
    const sql = `
      SELECT g.*, u.nama, u.email, u.role
      FROM guru g
      JOIN users u ON g.user_id = u.id
      WHERE g.nip = ?
    `;
    const results = await query(sql, [nip]);
    return results[0] || null;
  }

  // Create guru (self-registration, status: pending)
  static async create(userData) {
    const { nama, email, password, nip, link_dokumen, no_hp, sekolah_asal, mata_pelajaran } = userData;

    // First create the user
    const user = await User.create({
      nama,
      email,
      password,
      role: 'guru'
    });

    // Then create guru record with pending status and additional fields
    const sql = 'INSERT INTO guru (user_id, nip, link_dokumen, no_hp, sekolah_asal, mata_pelajaran, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const safeLink = link_dokumen && link_dokumen !== '' ? link_dokumen : null;
    const safeNoHp = no_hp && no_hp !== '' ? no_hp : null;
    const safeSekolah = sekolah_asal && sekolah_asal !== '' ? sekolah_asal : null;
    const safeMapel = mata_pelajaran && mata_pelajaran !== '' ? mata_pelajaran : null;
    const result = await query(sql, [user.id, nip, safeLink, safeNoHp, safeSekolah, safeMapel, 'pending']);

    return {
      id: result.insertId,
      user_id: user.id,
      nama: user.nama,
      email: user.email,
      nip,
      link_dokumen: safeLink,
      no_hp: safeNoHp,
      sekolah_asal: safeSekolah,
      mata_pelajaran: safeMapel,
      status: 'pending'
    };
  }

  // Update guru profile
  static async update(id, guruData) {
    const { nama, email, nip, link_dokumen, no_hp, sekolah_asal, mata_pelajaran } = guruData;
    const guru = await this.findById(id);
    
    if (!guru) return null;

    // Update user data
    await User.update(guru.user_id, { nama, email });

    // Update guru data with additional fields
    const sql = 'UPDATE guru SET nip = ?, link_dokumen = ?, no_hp = ?, sekolah_asal = ?, mata_pelajaran = ? WHERE id = ?';
    const safeLink = link_dokumen && link_dokumen !== '' ? link_dokumen : null;
    const safeNoHp = no_hp && no_hp !== '' ? no_hp : null;
    const safeSekolah = sekolah_asal && sekolah_asal !== '' ? sekolah_asal : null;
    const safeMapel = mata_pelajaran && mata_pelajaran !== '' ? mata_pelajaran : null;
    await query(sql, [nip, safeLink, safeNoHp, safeSekolah, safeMapel, id]);

    return this.findById(id);
  }

  // Approve guru
  static async approve(id, adminId) {
    const sql = `
      UPDATE guru 
      SET status = 'active', verified_by = ?, verified_at = NOW(), rejection_reason = NULL 
      WHERE id = ?
    `;
    await query(sql, [adminId, id]);
    return this.findById(id);
  }

  // Reject guru
  static async reject(id, adminId, reason) {
    const sql = `
      UPDATE guru 
      SET status = 'reject', verified_by = ?, verified_at = NOW(), rejection_reason = ? 
      WHERE id = ?
    `;
    await query(sql, [adminId, reason, id]);
    return this.findById(id);
  }

  // Get all guru
  static async findAll() {
    const sql = `
      SELECT g.*, u.nama, u.email, u.created_at as user_created_at,
             verifier.nama as verified_by_name
      FROM guru g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN admin a ON g.verified_by = a.id
      LEFT JOIN users verifier ON a.user_id = verifier.id
      ORDER BY g.created_at DESC
    `;
    return query(sql);
  }

  // Get guru by status
  static async findByStatus(status) {
    const sql = `
      SELECT g.*, u.nama, u.email, u.created_at as user_created_at
      FROM guru g
      JOIN users u ON g.user_id = u.id
      WHERE g.status = ?
      ORDER BY g.created_at DESC
    `;
    return query(sql, [status]);
  }

  // Count guru by status
  static async countByStatus(status) {
    const sql = 'SELECT COUNT(*) as count FROM guru WHERE status = ?';
    const results = await query(sql, [status]);
    return results[0].count;
  }

  // Count all guru
  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM guru';
    const results = await query(sql);
    return results[0].count;
  }

  // Check if NIP exists
  static async nipExists(nip, excludeId = null) {
    let sql = 'SELECT id FROM guru WHERE nip = ?';
    const params = [nip];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await query(sql, params);
    return results.length > 0;
  }

  // Delete guru
  static async delete(id) {
    const guru = await this.findById(id);
    if (guru) {
      await User.delete(guru.user_id);
    }
    return true;
  }
}

module.exports = Guru;