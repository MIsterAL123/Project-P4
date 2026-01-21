// Model untuk tabel kuota_p4
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

  // Find kuota by tahun ajaran
  static async findByTahunAjaran(tahunAjaran) {
    const sql = 'SELECT * FROM kuota_p4 WHERE tahun_ajaran = ?';
    const results = await query(sql, [tahunAjaran]);
    return results[0] || null;
  }

  // Create new kuota
  static async create(kuotaData) {
    const { tahun_ajaran, max_peserta = 50 } = kuotaData;
    
    const sql = 'INSERT INTO kuota_p4 (tahun_ajaran, max_peserta, peserta_terdaftar, status) VALUES (?, ?, 0, ?)';
    const result = await query(sql, [tahun_ajaran, max_peserta, 'open']);
    
    return {
      id: result.insertId,
      tahun_ajaran,
      max_peserta,
      peserta_terdaftar: 0,
      status: 'open'
    };
  }

  // Update kuota (allows updating tahun_ajaran, max_peserta, status)
  static async update(id, kuotaData) {
    const { tahun_ajaran, max_peserta, status } = kuotaData;
    // Use provided values (caller ensures validation)
    const sql = 'UPDATE kuota_p4 SET tahun_ajaran = ?, max_peserta = ?, status = ? WHERE id = ?';
    await query(sql, [tahun_ajaran, max_peserta, status, id]);
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
    const newStatus = newCount >= kuota.max_peserta ? 'full' : kuota.status;

    const sql = 'UPDATE kuota_p4 SET peserta_terdaftar = ?, status = ? WHERE id = ?';
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