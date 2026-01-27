// Model untuk tabel kuota_p4 (updated for pelatihan)
const { query } = require('../config/database');

class KuotaP4 {
  // Find kuota by ID
  static async findById(id) {
    const sql = 'SELECT * FROM kuota_p4 WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find active/open kuota
  static async findActiveKuota() {
    const sql = "SELECT * FROM kuota_p4 WHERE status IN ('open', 'full') ORDER BY created_at DESC LIMIT 1";
    const results = await query(sql);
    return results[0] || null;
  }

  // Find all active kuota (open)
  static async findAllActive() {
    const sql = "SELECT * FROM kuota_p4 WHERE status = 'open' ORDER BY tanggal_mulai ASC, created_at DESC";
    return query(sql);
  }

  // Find kuota for specific target (peserta/guru/semua) - accepts single value or array
  static async findByTarget(target) {
    if (Array.isArray(target)) {
      const placeholders = target.map(() => '?').join(', ');
      const sql = `SELECT * FROM kuota_p4 WHERE status = 'open' AND target_peserta IN (${placeholders}) ORDER BY tanggal_mulai ASC, created_at DESC`;
      return query(sql, target);
    } else {
      const sql = "SELECT * FROM kuota_p4 WHERE status = 'open' AND (target_peserta = ? OR target_peserta = 'semua') ORDER BY tanggal_mulai ASC, created_at DESC";
      return query(sql, [target]);
    }
  }

  // Find kuota by tahun ajaran
  static async findByTahunAjaran(tahunAjaran) {
    const sql = 'SELECT * FROM kuota_p4 WHERE tahun_ajaran = ?';
    const results = await query(sql, [tahunAjaran]);
    return results[0] || null;
  }

  // Create new kuota (updated with new fields)
  static async create(kuotaData) {
    const { 
      judul_pelatihan, 
      tahun_ajaran, 
      waktu_pelatihan,
      tanggal_mulai,
      tanggal_selesai,
      max_peserta = 50, 
      target_peserta = 'semua',
      deskripsi
    } = kuotaData;
    
    const sql = `
      INSERT INTO kuota_p4 (judul_pelatihan, tahun_ajaran, waktu_pelatihan, tanggal_mulai, tanggal_selesai, max_peserta, peserta_terdaftar, guru_terdaftar, target_peserta, deskripsi, status) 
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'open')
    `;
    const result = await query(sql, [
      judul_pelatihan || 'Program P4',
      tahun_ajaran,
      waktu_pelatihan || null,
      tanggal_mulai || null,
      tanggal_selesai || null,
      max_peserta,
      target_peserta,
      deskripsi || null
    ]);
    
    return {
      id: result.insertId,
      judul_pelatihan,
      tahun_ajaran,
      waktu_pelatihan,
      tanggal_mulai,
      tanggal_selesai,
      max_peserta,
      peserta_terdaftar: 0,
      guru_terdaftar: 0,
      target_peserta,
      deskripsi,
      status: 'open'
    };
  }

  // Update kuota (updated with new fields)
  static async update(id, kuotaData) {
    const { 
      judul_pelatihan,
      tahun_ajaran, 
      waktu_pelatihan,
      tanggal_mulai,
      tanggal_selesai,
      max_peserta, 
      target_peserta,
      deskripsi,
      status 
    } = kuotaData;
    
    const sql = `
      UPDATE kuota_p4 SET 
        judul_pelatihan = ?, 
        tahun_ajaran = ?, 
        waktu_pelatihan = ?,
        tanggal_mulai = ?,
        tanggal_selesai = ?,
        max_peserta = ?, 
        target_peserta = ?,
        deskripsi = ?,
        status = ? 
      WHERE id = ?
    `;
    await query(sql, [
      judul_pelatihan,
      tahun_ajaran, 
      waktu_pelatihan || null,
      tanggal_mulai || null,
      tanggal_selesai || null,
      max_peserta, 
      target_peserta || 'semua',
      deskripsi || null,
      status, 
      id
    ]);
    return this.findById(id);
  }

  // Update status only
  static async updateStatus(id, status) {
    const sql = 'UPDATE kuota_p4 SET status = ? WHERE id = ?';
    await query(sql, [status, id]);
    return this.findById(id);
  }

  // Increment peserta count
  static async incrementPeserta(id) {
    const kuota = await this.findById(id);
    if (!kuota) return null;

    const newCount = kuota.peserta_terdaftar + 1;
    const totalRegistered = newCount + (kuota.guru_terdaftar || 0);
    const newStatus = totalRegistered >= kuota.max_peserta ? 'full' : kuota.status;

    const sql = 'UPDATE kuota_p4 SET peserta_terdaftar = ?, status = ? WHERE id = ?';
    await query(sql, [newCount, newStatus, id]);
    
    return this.findById(id);
  }

  // Increment guru peserta count
  static async incrementGuruPeserta(id) {
    const kuota = await this.findById(id);
    if (!kuota) return null;

    const newCount = (kuota.guru_terdaftar || 0) + 1;
    const totalRegistered = kuota.peserta_terdaftar + newCount;
    const newStatus = totalRegistered >= kuota.max_peserta ? 'full' : kuota.status;

    const sql = 'UPDATE kuota_p4 SET guru_terdaftar = ?, status = ? WHERE id = ?';
    await query(sql, [newCount, newStatus, id]);
    
    return this.findById(id);
  }

  // Decrement peserta count
  static async decrementPeserta(id) {
    const kuota = await this.findById(id);
    if (!kuota || kuota.peserta_terdaftar <= 0) return null;

    const newCount = kuota.peserta_terdaftar - 1;
    const newStatus = kuota.status === 'full' ? 'open' : kuota.status;

    const sql = 'UPDATE kuota_p4 SET peserta_terdaftar = ?, status = ? WHERE id = ?';
    await query(sql, [newCount, newStatus, id]);
    
    return this.findById(id);
  }

  // Decrement guru peserta count
  static async decrementGuruPeserta(id) {
    const kuota = await this.findById(id);
    if (!kuota || (kuota.guru_terdaftar || 0) <= 0) return null;

    const newCount = (kuota.guru_terdaftar || 0) - 1;
    const newStatus = kuota.status === 'full' ? 'open' : kuota.status;

    const sql = 'UPDATE kuota_p4 SET guru_terdaftar = ?, status = ? WHERE id = ?';
    await query(sql, [newCount, newStatus, id]);
    
    return this.findById(id);
  }

  // Get all kuota
  static async findAll() {
    const sql = 'SELECT * FROM kuota_p4 ORDER BY created_at DESC';
    return query(sql);
  }

  // Check if kuota available
  static async isAvailable(id) {
    const kuota = await this.findById(id);
    if (!kuota) return false;
    return kuota.status === 'open' && kuota.peserta_terdaftar < kuota.max_peserta;
  }

  // Get available slots
  static async getAvailableSlots(id) {
    const kuota = await this.findById(id);
    if (!kuota) return 0;
    return Math.max(0, kuota.max_peserta - kuota.peserta_terdaftar);
  }

  // Delete kuota
  static async delete(id) {
    const sql = 'DELETE FROM kuota_p4 WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = KuotaP4;