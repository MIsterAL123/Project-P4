// Manajemen kuota P4 (Updated for pelatihan)
const KuotaP4 = require('../models/KuotaP4');
const PendaftaranP4 = require('../models/PendaftaranP4');
const logger = require('../utils/logger');

// @desc    Show manage kuota page
// @route   GET /admin/manage-kuota
const showManageKuotaPage = async (req, res) => {
  try {
    const kuotaList = await KuotaP4.findAll();
    const activeKuota = await KuotaP4.findActiveKuota();

    res.render('admin/manage-kuota', {
      title: 'Kelola Kuota Pelatihan - P4 Jakarta',
      layout: 'layouts/admin',
      kuotaList,
      activeKuota,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show manage kuota error:', error);
    req.session.error = 'Gagal memuat data kuota';
    res.redirect('/admin/dashboard');
  }
};

// @desc    Create new kuota
// @route   POST /admin/kuota/create
const createKuota = async (req, res) => {
  try {
    const { 
      judul_pelatihan, 
      tahun_ajaran, 
      waktu_pelatihan,
      tanggal_mulai,
      tanggal_selesai,
      max_peserta,
      target_peserta,
      deskripsi
    } = req.body;

    // Validation
    if (!judul_pelatihan || judul_pelatihan.trim() === '') {
      req.session.error = 'Judul pelatihan wajib diisi';
      return res.redirect('/admin/manage-kuota');
    }

    await KuotaP4.create({
      judul_pelatihan: judul_pelatihan.trim(),
      tahun_ajaran: tahun_ajaran || new Date().getFullYear().toString(),
      waktu_pelatihan: waktu_pelatihan || null,
      tanggal_mulai: tanggal_mulai || null,
      tanggal_selesai: tanggal_selesai || null,
      max_peserta: parseInt(max_peserta) || 50,
      target_peserta: target_peserta || 'semua',
      deskripsi: deskripsi || null
    });

    logger.info(`New kuota created by ${req.user.email}: ${judul_pelatihan}`);
    req.session.success = 'Kuota pelatihan baru berhasil dibuat';
    res.redirect('/admin/manage-kuota');
  } catch (error) {
    logger.error('Create kuota error:', error);
    req.session.error = 'Gagal membuat kuota';
    res.redirect('/admin/manage-kuota');
  }
};

// @desc    Update kuota
// @route   POST /admin/kuota/update
const updateKuota = async (req, res) => {
  try {
    const { 
      id, 
      judul_pelatihan,
      tahun_ajaran,
      waktu_pelatihan,
      tanggal_mulai,
      tanggal_selesai,
      max_peserta, 
      target_peserta,
      deskripsi
    } = req.body;
    let { status } = req.body;

    const kuota = await KuotaP4.findById(id);
    if (!kuota) {
      req.session.error = 'Kuota tidak ditemukan';
      return res.redirect('/admin/manage-kuota');
    }

    // Validate judul_pelatihan
    if (!judul_pelatihan || judul_pelatihan.trim() === '') {
      req.session.error = 'Judul pelatihan wajib diisi';
      return res.redirect('/admin/manage-kuota');
    }

    // Validate max_peserta
    const newMax = parseInt(max_peserta);
    if (isNaN(newMax) || newMax < 1) {
      req.session.error = 'Jumlah maksimal peserta tidak valid';
      return res.redirect('/admin/manage-kuota');
    }

    // Cannot set max below current registered count
    const totalRegistered = (kuota.peserta_terdaftar || 0) + (kuota.guru_terdaftar || 0);
    if (newMax < totalRegistered) {
      req.session.error = `Tidak bisa mengubah kuota di bawah jumlah peserta terdaftar (${totalRegistered})`;
      return res.redirect('/admin/manage-kuota');
    }

    // If status not provided by the form, retain existing status
    if (typeof status === 'undefined' || status === '') {
      status = kuota.status;
    }

    await KuotaP4.update(id, { 
      judul_pelatihan: judul_pelatihan.trim(),
      tahun_ajaran: tahun_ajaran || kuota.tahun_ajaran,
      waktu_pelatihan: waktu_pelatihan || null,
      tanggal_mulai: tanggal_mulai || null,
      tanggal_selesai: tanggal_selesai || null,
      max_peserta: newMax, 
      target_peserta: target_peserta || 'semua',
      deskripsi: deskripsi || null,
      status 
    });

    logger.info(`Kuota updated by ${req.user.email}: ID ${id}`);
    req.session.success = 'Kuota berhasil diperbarui';
    res.redirect('/admin/manage-kuota');
  } catch (error) {
    logger.error('Update kuota error:', error);
    req.session.error = 'Gagal memperbarui kuota';
    res.redirect('/admin/manage-kuota');
  }
};

// @desc    Toggle kuota status (open/closed)
// @route   POST /admin/kuota/:id/toggle-status
const toggleKuotaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const kuota = await KuotaP4.findById(id);

    if (!kuota) {
      req.session.error = 'Kuota tidak ditemukan';
      return res.redirect('/admin/manage-kuota');
    }

    // Toggle status
    let newStatus;
    if (kuota.status === 'open') {
      newStatus = 'closed';
    } else if (kuota.status === 'closed') {
      // Check if kuota is full before reopening
      newStatus = kuota.peserta_terdaftar >= kuota.max_peserta ? 'full' : 'open';
    } else if (kuota.status === 'full') {
      newStatus = 'closed';
    }

    await KuotaP4.updateStatus(id, newStatus);

    logger.info(`Kuota status toggled by ${req.user.email}: ID ${id} -> ${newStatus}`);
    req.session.success = `Status kuota berhasil diubah menjadi ${newStatus}`;
    res.redirect('/admin/manage-kuota');
  } catch (error) {
    logger.error('Toggle kuota status error:', error);
    req.session.error = 'Gagal mengubah status kuota';
    res.redirect('/admin/manage-kuota');
  }
};

// @desc    Delete kuota
// @route   POST /admin/kuota/:id/delete
const deleteKuota = async (req, res) => {
  try {
    const { id } = req.params;
    const kuota = await KuotaP4.findById(id);

    if (!kuota) {
      req.session.error = 'Kuota tidak ditemukan';
      return res.redirect('/admin/manage-kuota');
    }

    // Check if there are registrations
    const registrations = await PendaftaranP4.countByStatus('registered', id);
    if (registrations > 0) {
      req.session.error = 'Tidak dapat menghapus kuota yang memiliki peserta terdaftar';
      return res.redirect('/admin/manage-kuota');
    }

    await KuotaP4.delete(id);

    logger.info(`Kuota deleted by ${req.user.email}: ID ${id}`);
    req.session.success = 'Kuota berhasil dihapus';
    res.redirect('/admin/manage-kuota');
  } catch (error) {
    logger.error('Delete kuota error:', error);
    req.session.error = 'Gagal menghapus kuota';
    res.redirect('/admin/manage-kuota');
  }
};

// @desc    Get kuota info (API)
// @route   GET /api/kuota/info
const getKuotaInfo = async (req, res) => {
  try {
    const kuota = await KuotaP4.findActiveKuota();
    
    if (!kuota) {
      return res.json({
        success: false,
        message: 'Tidak ada kuota aktif'
      });
    }

    res.json({
      success: true,
      data: {
        tahun_ajaran: kuota.tahun_ajaran,
        max_peserta: kuota.max_peserta,
        peserta_terdaftar: kuota.peserta_terdaftar,
        sisa_kuota: kuota.max_peserta - kuota.peserta_terdaftar,
        status: kuota.status
      }
    });
  } catch (error) {
    logger.error('Get kuota info error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil informasi kuota'
    });
  }
};

module.exports = {
  showManageKuotaPage,
  createKuota,
  updateKuota,
  toggleKuotaStatus,
  deleteKuota,
  getKuotaInfo
};