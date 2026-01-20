// Pendaftaran P4
const PendaftaranP4 = require('../models/PendaftaranP4');
const KuotaP4 = require('../models/KuotaP4');
const Peserta = require('../models/Peserta');
const logger = require('../utils/logger');

// @desc    Show daftar P4 page
// @route   GET /peserta/daftar-p4
const showDaftarP4Page = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    const kuota = await KuotaP4.findActiveKuota();
    let pendaftaran = null;
    let alreadyRegistered = false;

    if (peserta && kuota) {
      pendaftaran = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
      alreadyRegistered = pendaftaran && pendaftaran.status === 'registered';
    }

    res.render('peserta/daftar-p4', {
      title: 'Daftar Program P4 - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      kuota,
      pendaftaran,
      alreadyRegistered,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show daftar P4 page error:', error);
    req.session.error = 'Gagal memuat halaman pendaftaran';
    res.redirect('/peserta/dashboard');
  }
};

// @desc    Process daftar P4
// @route   POST /peserta/daftar-p4
const daftarP4 = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    
    if (!peserta) {
      req.session.error = 'Data peserta tidak ditemukan';
      return res.redirect('/peserta/daftar-p4');
    }

    const kuota = await KuotaP4.findActiveKuota();
    
    if (!kuota) {
      req.session.error = 'Tidak ada periode pendaftaran yang aktif';
      return res.redirect('/peserta/daftar-p4');
    }

    // Check if kuota is open
    if (kuota.status !== 'open') {
      req.session.error = 'Pendaftaran sudah ditutup';
      return res.redirect('/peserta/daftar-p4');
    }

    // Check if already registered
    const existing = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
    if (existing && existing.status === 'registered') {
      req.session.error = 'Anda sudah terdaftar pada periode ini';
      return res.redirect('/peserta/daftar-p4');
    }

    // Register
    const pendaftaran = await PendaftaranP4.create(peserta.id, kuota.id);

    logger.info(`New P4 registration: ${req.user.email} - Nomor Urut: ${pendaftaran.nomor_urut}`);
    req.session.success = `Pendaftaran berhasil! Nomor urut Anda: ${pendaftaran.nomor_urut}`;
    res.redirect('/peserta/status-pendaftaran');
  } catch (error) {
    logger.error('Daftar P4 error:', error);
    req.session.error = error.message || 'Gagal melakukan pendaftaran';
    res.redirect('/peserta/daftar-p4');
  }
};

// @desc    Show status pendaftaran
// @route   GET /peserta/status-pendaftaran
const showStatusPendaftaran = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    let pendaftaranList = [];
    let currentPendaftaran = null;

    if (peserta) {
      pendaftaranList = await PendaftaranP4.findByPesertaId(peserta.id);
      
      // Get current active kuota pendaftaran
      const kuota = await KuotaP4.findActiveKuota();
      if (kuota) {
        currentPendaftaran = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
      }
    }

    res.render('peserta/status-pendaftaran', {
      title: 'Status Pendaftaran - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      pendaftaranList,
      currentPendaftaran,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show status pendaftaran error:', error);
    req.session.error = 'Gagal memuat status pendaftaran';
    res.redirect('/peserta/dashboard');
  }
};

// @desc    Cancel pendaftaran
// @route   POST /peserta/pendaftaran/:id/cancel
const cancelPendaftaran = async (req, res) => {
  try {
    const { id } = req.params;
    const peserta = await Peserta.findByUserId(req.user.id);
    
    if (!peserta) {
      req.session.error = 'Data peserta tidak ditemukan';
      return res.redirect('/peserta/status-pendaftaran');
    }

    const pendaftaran = await PendaftaranP4.findById(id);
    
    if (!pendaftaran) {
      req.session.error = 'Pendaftaran tidak ditemukan';
      return res.redirect('/peserta/status-pendaftaran');
    }

    // Verify ownership
    if (pendaftaran.peserta_id !== peserta.id) {
      req.session.error = 'Anda tidak memiliki akses ke pendaftaran ini';
      return res.redirect('/peserta/status-pendaftaran');
    }

    await PendaftaranP4.cancel(id);

    logger.info(`P4 registration cancelled: ${req.user.email} - ID: ${id}`);
    req.session.success = 'Pendaftaran berhasil dibatalkan';
    res.redirect('/peserta/status-pendaftaran');
  } catch (error) {
    logger.error('Cancel pendaftaran error:', error);
    req.session.error = error.message || 'Gagal membatalkan pendaftaran';
    res.redirect('/peserta/status-pendaftaran');
  }
};

// @desc    Show my courses
// @route   GET /peserta/my-courses
const showMyCourses = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    let pendaftaranList = [];

    if (peserta) {
      pendaftaranList = await PendaftaranP4.findByPesertaId(peserta.id);
    }

    res.render('peserta/my-courses', {
      title: 'Kursus Saya - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      pendaftaranList,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show my courses error:', error);
    req.session.error = 'Gagal memuat data kursus';
    res.redirect('/peserta/dashboard');
  }
};

module.exports = {
  showDaftarP4Page,
  daftarP4,
  showStatusPendaftaran,
  cancelPendaftaran,
  showMyCourses
};