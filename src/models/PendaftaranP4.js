// Model untuk tabel pendaftaran_p4
const { query, transaction } = require('../config/database');
const KuotaP4 = require('./KuotaP4');

class PendaftaranP4 {
  // Find pendaftaran by ID
  static async findById(id) {
    const sql = `
      SELECT pd.*, p.nik, u.nama, u.email, k.judul_pelatihan, k.tahun_ajaran, k.max_peserta, k.tanggal_mulai, k.tanggal_selesai
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
      SELECT pd.*, k.judul_pelatihan, k.tahun_ajaran, k.max_peserta, k.status as kuota_status, k.tanggal_mulai, k.tanggal_selesai
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
      SELECT pd.*, k.judul_pelatihan, k.tahun_ajaran
      FROM pendaftaran_p4 pd
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      WHERE pd.peserta_id = ? AND pd.kuota_id = ?
    `;
    const results = await query(sql, [pesertaId, kuotaId]);
    return results[0] || null;
  }

  // Count registrations in current year for a peserta
  static async countRegistrationsThisYear(pesertaId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM pendaftaran_p4 
      WHERE peserta_id = ? 
      AND status = 'registered'
      AND YEAR(tanggal_daftar) = YEAR(CURDATE())
    `;
    const results = await query(sql, [pesertaId]);
    return results[0].count;
  }

  // Create pendaftaran (with quota check and yearly limit)
  static async create(pesertaId, kuotaId) {
    // Check yearly limit (max 3 per year)
    const yearlyCount = await this.countRegistrationsThisYear(pesertaId);
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
    if (kuota.target_peserta === 'guru') {
      throw new Error('Pelatihan ini hanya untuk tenaga kependidikan');
    }
    if (kuota.peserta_terdaftar >= kuota.max_peserta) {
      throw new Error('Kuota sudah penuh');
    }

    // Check if peserta already registered
    const existing = await this.findByPesertaAndKuota(pesertaId, kuotaId);
    if (existing) {
      throw new Error('Anda sudah terdaftar pada pelatihan ini');
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
      SELECT pd.*, p.nik, u.nama, u.email, k.judul_pelatihan, k.tahun_ajaran
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

  // Update status
  static async updateStatus(id, status) {
    const sql = 'UPDATE pendaftaran_p4 SET status = ? WHERE id = ?';
    await query(sql, [status, id]);
    return this.findById(id);
  }

  // Find pendaftaran peserta/siswa with filters (for admin)
  static async findPesertaPendaftaran(kuotaId = null, status = null) {
    let sql = `
      SELECT pd.*, p.nik, u.nama as nama_peserta, u.email, k.judul_pelatihan, k.tahun_ajaran, 
             COALESCE(pd.created_at, pd.tanggal_daftar) as created_at
      FROM pendaftaran_p4 pd
      JOIN peserta p ON pd.peserta_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN kuota_p4 k ON pd.kuota_id = k.id
      WHERE 1=1
    `;
    const params = [];

    if (kuotaId) {
      sql += ' AND pd.kuota_id = ?';
      params.push(kuotaId);
    }
    if (status) {
      sql += ' AND pd.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY COALESCE(pd.created_at, pd.tanggal_daftar) DESC';
    return query(sql, params);
  }

  // Find pendaftaran guru/pendidik with filters (for admin)
  static async findGuruPendaftaran(kuotaId = null, status = null) {
    let sql = `
      SELECT pg.*, g.nip, u.nama as nama_guru, u.email, k.judul_pelatihan, k.tahun_ajaran, 
             COALESCE(pg.created_at, pg.tanggal_daftar) as created_at
      FROM pendaftaran_guru_p4 pg
      JOIN guru g ON pg.guru_id = g.id
      JOIN users u ON g.user_id = u.id
      JOIN kuota_p4 k ON pg.kuota_id = k.id
      WHERE 1=1
    `;
    const params = [];

    if (kuotaId) {
      sql += ' AND pg.kuota_id = ?';
      params.push(kuotaId);
    }
    if (status) {
      sql += ' AND pg.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY COALESCE(pg.created_at, pg.tanggal_daftar) DESC';
    return query(sql, params);
  }
}

module.exports = PendaftaranP4;