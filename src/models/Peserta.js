// Model untuk tabel peserta
const { query } = require('../config/database');
const User = require('./User');

class Peserta {
  // Find peserta by ID
  static async findById(id) {
    const sql = `
      SELECT p.*, u.nama, u.email, u.role, u.created_at as user_created_at
      FROM peserta p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find peserta by user_id
  static async findByUserId(userId) {
    const sql = `
      SELECT p.*, u.nama, u.email, u.role
      FROM peserta p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `;
    const results = await query(sql, [userId]);
    return results[0] || null;
  }

  // Find peserta by NIK
  static async findByNik(nik) {
    const sql = `
      SELECT p.*, u.nama, u.email, u.role
      FROM peserta p
      JOIN users u ON p.user_id = u.id
      WHERE p.nik = ?
    `;
    const results = await query(sql, [nik]);
    return results[0] || null;
  }

  // Create peserta (self-registration, langsung active)
  static async create(userData) {
    const { nama, email, password, nik, link_dokumen, no_hp, sekolah_asal, kelas } = userData;

    // First create the user
    const user = await User.create({
      nama,
      email,
      password,
      role: 'peserta'
    });

    // Then create peserta record with additional fields
    const sql = 'INSERT INTO peserta (user_id, nik, link_dokumen, no_hp, sekolah_asal, kelas) VALUES (?, ?, ?, ?, ?, ?)';
    // Ensure we don't pass undefined to DB driver (use null for missing values)
    const safeLink = link_dokumen && link_dokumen !== '' ? link_dokumen : null;
    const safeNoHp = no_hp && no_hp !== '' ? no_hp : null;
    const safeSekolah = sekolah_asal && sekolah_asal !== '' ? sekolah_asal : null;
    const safeKelas = kelas && kelas !== '' ? kelas : null;
    const result = await query(sql, [user.id, nik, safeLink, safeNoHp, safeSekolah, safeKelas]);

    return {
      id: result.insertId,
      user_id: user.id,
      nama: user.nama,
      email: user.email,
      nik,
      link_dokumen: safeLink,
      no_hp: safeNoHp,
      sekolah_asal: safeSekolah,
      kelas: safeKelas
    };
  }

  // Update peserta profile
  static async update(id, pesertaData) {
    const { nama, email, nik, link_dokumen, no_hp, sekolah_asal, kelas } = pesertaData;
    const peserta = await this.findById(id);
    
    if (!peserta) return null;

    // Update user data
    await User.update(peserta.user_id, { nama, email });

    // Update peserta data with additional fields
    const sql = 'UPDATE peserta SET nik = ?, link_dokumen = ?, no_hp = ?, sekolah_asal = ?, kelas = ? WHERE id = ?';
    const safeLink = link_dokumen && link_dokumen !== '' ? link_dokumen : null;
    const safeNoHp = no_hp && no_hp !== '' ? no_hp : null;
    const safeSekolah = sekolah_asal && sekolah_asal !== '' ? sekolah_asal : null;
    const safeKelas = kelas && kelas !== '' ? kelas : null;
    await query(sql, [nik, safeLink, safeNoHp, safeSekolah, safeKelas, id]);

    return this.findById(id);
  }

  // Get all peserta
  static async findAll() {
    const sql = `
      SELECT p.*, u.nama, u.email, u.created_at as user_created_at
      FROM peserta p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
    return query(sql);
  }

  // Get peserta with pendaftaran status
  static async findAllWithPendaftaran(kuotaId = null) {
    let sql = `
      SELECT p.*, u.nama, u.email, u.created_at as user_created_at,
             pd.id as pendaftaran_id, pd.nomor_urut, pd.tanggal_daftar, pd.status as pendaftaran_status
      FROM peserta p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN pendaftaran_p4 pd ON p.id = pd.peserta_id
    `;
    
    const params = [];
    if (kuotaId) {
      sql += ' AND pd.kuota_id = ?';
      params.push(kuotaId);
    }
    
    sql += ' ORDER BY pd.nomor_urut ASC, p.created_at DESC';
    
    return query(sql, params);
  }

  // Count all peserta
  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM peserta';
    const results = await query(sql);
    return results[0].count;
  }

  // Check if NIK exists
  static async nikExists(nik, excludeId = null) {
    let sql = 'SELECT id FROM peserta WHERE nik = ?';
    const params = [nik];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await query(sql, params);
    return results.length > 0;
  }

  // Delete peserta
  static async delete(id) {
    const peserta = await this.findById(id);
    if (peserta) {
      await User.delete(peserta.user_id);
    }
    return true;
  }
}

module.exports = Peserta;