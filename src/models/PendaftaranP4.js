// Model untuk tabel pendaftaran_p4
const { query, transaction } = require('../config/database');
const KuotaP4 = require('./KuotaP4');

class PendaftaranP4 {
  // Find pendaftaran by ID
  static async findById(id) {
    const sql = `
      SELECT pd.*, p.nik, u.nama, u.email, k.tahun_ajaran, k.max_peserta
      FROM pendaftaran_p4 pd
      JOIN peserta p ON pd.peserta_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      WHERE pd.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find pendaftaran by peserta_id
  static async findByPesertaId(pesertaId) {
    const sql = `
      SELECT pd.*, k.tahun_ajaran, k.max_peserta, k.status as kuota_status
      FROM pendaftaran_p4 pd
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      WHERE pd.peserta_id = ?
      ORDER BY pd.tanggal_daftar DESC
    `;
    return query(sql, [pesertaId]);
  }

  // Find pendaftaran by peserta_id and kuota_id
  static async findByPesertaAndKuota(pesertaId, kuotaId) {
    const sql = `
      SELECT pd.*, k.tahun_ajaran
      FROM pendaftaran_p4 pd
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      WHERE pd.peserta_id = ? AND pd.kuota_id = ?
    `;
    const results = await query(sql, [pesertaId, kuotaId]);
    return results[0] || null;
  }

  // Create pendaftaran (with quota check)
  static async create(pesertaId, kuotaId) {
    // Check if kuota available
    const kuota = await KuotaP4.findById(kuotaId);
    if (!kuota) {
      throw new Error('Kuota tidak ditemukan');
    }
    if (kuota.status !== 'open') {
      throw new Error('Pendaftaran sudah ditutup');
    }
    if (kuota.peserta_terdaftar >= kuota.max_peserta) {
      throw new Error('Kuota sudah penuh');
    }

    // Check if peserta already registered
    const existing = await this.findByPesertaAndKuota(pesertaId, kuotaId);
    if (existing) {
      throw new Error('Anda sudah terdaftar pada periode ini');
    }

    // Get next nomor urut
    const nomorUrut = kuota.peserta_terdaftar + 1;

    // Insert pendaftaran
    const sql = `
      INSERT INTO pendaftaran_p4 (peserta_id, kuota_id, nomor_urut, status) 
      VALUES (?, ?, ?, 'registered')
    `;
    const result = await query(sql, [pesertaId, kuotaId, nomorUrut]);

    // Update kuota count
    await KuotaP4.incrementPeserta(kuotaId);

    return {
      id: result.insertId,
      peserta_id: pesertaId,
      kuota_id: kuotaId,
      nomor_urut: nomorUrut,
      status: 'registered'
    };
  }

  // Cancel pendaftaran
  static async cancel(id) {
    const pendaftaran = await this.findById(id);
    if (!pendaftaran) {
      throw new Error('Pendaftaran tidak ditemukan');
    }
    if (pendaftaran.status === 'cancelled') {
      throw new Error('Pendaftaran sudah dibatalkan');
    }

    // Update status to cancelled
    const sql = "UPDATE pendaftaran_p4 SET status = 'cancelled' WHERE id = ?";
    await query(sql, [id]);

    // Decrement kuota count
    await KuotaP4.decrementPeserta(pendaftaran.kuota_id);

    return this.findById(id);
  }

  // Get all pendaftaran by kuota
  static async findByKuotaId(kuotaId) {
    const sql = `
      SELECT pd.*, p.nik, u.nama, u.email
      FROM pendaftaran_p4 pd
      JOIN peserta p ON pd.peserta_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pd.kuota_id = ?
      ORDER BY pd.nomor_urut ASC
    `;
    return query(sql, [kuotaId]);
  }

  // Get all pendaftaran (with peserta and kuota info)
  static async findAll() {
    const sql = `
      SELECT pd.*, p.nik, u.nama, u.email, k.tahun_ajaran
      FROM pendaftaran_p4 pd
      JOIN peserta p ON pd.peserta_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      ORDER BY pd.tanggal_daftar DESC
    `;
    return query(sql);
  }

  // Count pendaftaran by status
  static async countByStatus(status, kuotaId = null) {
    let sql = 'SELECT COUNT(*) as count FROM pendaftaran_p4 WHERE status = ?';
    const params = [status];
    
    if (kuotaId) {
      sql += ' AND kuota_id = ?';
      params.push(kuotaId);
    }
    
    const results = await query(sql, params);
    return results[0].count;
  }

  // Count all pendaftaran
  static async count(kuotaId = null) {
    let sql = 'SELECT COUNT(*) as count FROM pendaftaran_p4';
    const params = [];
    
    if (kuotaId) {
      sql += ' WHERE kuota_id = ?';
      params.push(kuotaId);
    }
    
    const results = await query(sql, params);
    return results[0].count;
  }

  // Delete pendaftaran
  static async delete(id) {
    const pendaftaran = await this.findById(id);
    if (pendaftaran && pendaftaran.status === 'registered') {
      await KuotaP4.decrementPeserta(pendaftaran.kuota_id);
    }
    
    const sql = 'DELETE FROM pendaftaran_p4 WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = PendaftaranP4;