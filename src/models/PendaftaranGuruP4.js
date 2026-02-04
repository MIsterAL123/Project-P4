// Model untuk tabel pendaftaran_guru_p4
const { query } = require('../config/database');
const KuotaP4 = require('./KuotaP4');

class PendaftaranGuruP4 {
  // Find pendaftaran by ID
  static async findById(id) {
    const sql = `
      SELECT pg.*, g.nip, u.nama, u.email, k.judul_pelatihan, k.tahun_ajaran, k.max_peserta, k.tanggal_mulai, k.tanggal_selesai
      FROM pendaftaran_guru_p4 pg
      JOIN guru g ON pg.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      JOIN kuota_p4 k ON pg.kuota_id = k.id
      WHERE pg.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find pendaftaran by guru_id
  static async findByGuruId(guruId) {
    const sql = `
      SELECT pg.*, k.judul_pelatihan, k.tahun_ajaran, k.max_peserta, k.status as kuota_status, k.tanggal_mulai, k.tanggal_selesai
      FROM pendaftaran_guru_p4 pg
      JOIN kuota_p4 k ON pg.kuota_id = k.id
      WHERE pg.guru_id = ?
      ORDER BY pg.tanggal_daftar DESC
    `;
    return query(sql, [guruId]);
  }

  // Find pendaftaran by guru_id and kuota_id
  static async findByGuruAndKuota(guruId, kuotaId) {
    const sql = `
      SELECT pg.*, k.judul_pelatihan, k.tahun_ajaran
      FROM pendaftaran_guru_p4 pg
      JOIN kuota_p4 k ON pg.kuota_id = k.id
      WHERE pg.guru_id = ? AND pg.kuota_id = ?
    `;
    const results = await query(sql, [guruId, kuotaId]);
    return results[0] || null;
  }

  // Count registrations in current year for a guru
  static async countRegistrationsThisYear(guruId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM pendaftaran_guru_p4 
      WHERE guru_id = ? 
      AND status IN ('registered', 'approved', 'surat_terkirim')
      AND YEAR(tanggal_daftar) = YEAR(CURDATE())
    `;
    const results = await query(sql, [guruId]);
    return results[0].count;
  }

  // Create pendaftaran (with quota check and yearly limit)
  static async create(data) {
    // Support both new object format and old (guruId, kuotaId, suratTugasPath) format
    let guruId, kuotaId, suratTugasPath;
    
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      guruId = data.guru_id;
      kuotaId = data.kuota_id;
      suratTugasPath = data.surat_tugas || null;
    } else {
      // Legacy support
      guruId = arguments[0];
      kuotaId = arguments[1];
      suratTugasPath = arguments[2] || null;
    }
    
    // Check yearly limit (max 3 per year)
    const yearlyCount = await this.countRegistrationsThisYear(guruId);
    if (yearlyCount >= 3) {
      throw new Error('Anda sudah mencapai batas maksimal 3 kali pendaftaran pelatihan dalam tahun ini');
    }

    // Check if kuota available
    const kuota = await KuotaP4.findById(kuotaId);
    if (!kuota) {
      throw new Error('Kuota tidak ditemukan');
    }
    if (kuota.status !== 'open') {
      throw new Error('Pendaftaran sudah ditutup');
    }
    // Check target peserta
    if (kuota.target_peserta === 'peserta') {
      throw new Error('Pelatihan ini hanya untuk peserta didik');
    }

    // Check if guru already registered
    const existing = await this.findByGuruAndKuota(guruId, kuotaId);
    if (existing) {
      throw new Error('Anda sudah terdaftar pada pelatihan ini');
    }

    // Get next nomor urut for guru
    const countSql = 'SELECT COUNT(*) as count FROM pendaftaran_guru_p4 WHERE kuota_id = ? AND status = "registered"';
    const countResult = await query(countSql, [kuotaId]);
    const nomorUrut = countResult[0].count + 1;

    // Insert pendaftaran with status 'pending' if no surat tugas, otherwise 'registered'
    const status = suratTugasPath ? 'registered' : 'pending';
    const sql = `
      INSERT INTO pendaftaran_guru_p4 (guru_id, kuota_id, nomor_urut, surat_tugas, status) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [guruId, kuotaId, nomorUrut, suratTugasPath, status]);

    // Update guru_terdaftar count in kuota only if registered
    if (status === 'registered') {
      await KuotaP4.incrementGuruPeserta(kuotaId);
    }

    return {
      id: result.insertId,
      guru_id: guruId,
      kuota_id: kuotaId,
      nomor_urut: nomorUrut,
      surat_tugas: suratTugasPath,
      status: status
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
    const sql = "UPDATE pendaftaran_guru_p4 SET status = 'cancelled' WHERE id = ?";
    await query(sql, [id]);

    // Decrement guru count only if this registration had incremented it (registered/approved)
    if (pendaftaran.status === 'registered' || pendaftaran.status === 'approved') {
      await KuotaP4.decrementGuruPeserta(pendaftaran.kuota_id);
    }

    return this.findById(id);
  }

  // Get all pendaftaran by kuota
  static async findByKuotaId(kuotaId) {
    const sql = `
      SELECT pg.*, g.nip, u.nama, u.email
      FROM pendaftaran_guru_p4 pg
      JOIN guru g ON pg.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      WHERE pg.kuota_id = ?
      ORDER BY pg.nomor_urut ASC
    `;
    return query(sql, [kuotaId]);
  }

  // Get all pendaftaran (with guru and kuota info)
  static async findAll() {
    const sql = `
      SELECT pg.*, g.nip, u.nama, u.email, k.judul_pelatihan, k.tahun_ajaran
      FROM pendaftaran_guru_p4 pg
      JOIN guru g ON pg.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      JOIN kuota_p4 k ON pg.kuota_id = k.id
      ORDER BY pg.tanggal_daftar DESC
    `;
    return query(sql);
  }

  // Count pendaftaran by status
  static async countByStatus(status, kuotaId = null) {
    let sql = 'SELECT COUNT(*) as count FROM pendaftaran_guru_p4 WHERE status = ?';
    const params = [status];
    
    if (kuotaId) {
      sql += ' AND kuota_id = ?';
      params.push(kuotaId);
    }
    
    const results = await query(sql, params);
    return results[0].count;
  }

  // Count by kuota and status (for reports)
  static async countByKuotaAndStatus(kuotaId, status) {
    const sql = 'SELECT COUNT(*) as count FROM pendaftaran_guru_p4 WHERE kuota_id = ? AND status = ?';
    const results = await query(sql, [kuotaId, status]);
    return results[0].count;
  }

  // Update status
  static async updateStatus(id, status) {
    const sql = 'UPDATE pendaftaran_guru_p4 SET status = ? WHERE id = ?';
    await query(sql, [status, id]);
    return this.findById(id);
  }

  // Update surat tugas and mark as 'surat_terkirim'
  static async updateSuratTugas(id, suratTugasPath) {
    const sql = 'UPDATE pendaftaran_guru_p4 SET surat_tugas = ?, status = ? WHERE id = ?';
    await query(sql, [suratTugasPath, 'surat_terkirim', id]);
    return this.findById(id);
  }

  // Find by guru (alias for findByGuruId)
  static async findByGuru(guruId) {
    return this.findByGuruId(guruId);
  }

  // Delete pendaftaran
  static async delete(id) {
    const pendaftaran = await this.findById(id);
    if (pendaftaran && (pendaftaran.status === 'registered' || pendaftaran.status === 'approved')) {
      await KuotaP4.decrementGuruPeserta(pendaftaran.kuota_id);
    }
    
    const sql = 'DELETE FROM pendaftaran_guru_p4 WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = PendaftaranGuruP4;
