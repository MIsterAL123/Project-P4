// Pendaftaran P4
const PendaftaranP4 = require('../models/PendaftaranP4');
const KuotaP4 = require('../models/KuotaP4');
const Peserta = require('../models/Peserta');
const logger = require('../utils/logger');

// @desc    Show daftar pelatihan page
// @route   GET /peserta/daftar-pelatihan/:kuotaId
const showDaftarPelatihanPage = async (req, res) => {
  try {
    const { kuotaId } = req.params;
    const peserta = await Peserta.findByUserId(req.user.id);
    
    // Get specific kuota
    const kuota = await KuotaP4.findById(kuotaId);
    
    if (!kuota) {
      req.session.error = 'Pelatihan tidak ditemukan';
      return res.redirect('/peserta/pelatihan');
    }
    
    // Check if target is for peserta or semua
    if (!['peserta', 'semua'].includes(kuota.target_peserta)) {
      req.session.error = 'Pelatihan ini tidak tersedia untuk peserta didik';
      return res.redirect('/peserta/pelatihan');
    }
    
    // Check registration count this year
    const registrationsThisYear = await PendaftaranP4.countRegistrationsThisYear(peserta.id);
    const canRegister = registrationsThisYear < 3;
    
    // Check if already registered for this kuota
    let pendaftaran = null;
    let alreadyRegistered = false;
    
    if (peserta && kuota) {
      pendaftaran = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
      alreadyRegistered = pendaftaran && ['pending', 'approved', 'registered'].includes(pendaftaran.status);
    }

    res.render('peserta/daftar-pelatihan', {
      title: 'Daftar Pelatihan - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      kuota,
      pendaftaran,
      alreadyRegistered,
      registrationsThisYear,
      canRegister,
      maxRegistrations: 3,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show daftar pelatihan page error:', error);
    req.session.error = 'Gagal memuat halaman pendaftaran';
    res.redirect('/peserta/pelatihan');
  }
};

// @desc    Show available pelatihan list
// @route   GET /peserta/pelatihan
const showPelatihanList = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    
    // Get available pelatihan (target peserta or semua)
    const kuotaList = await KuotaP4.findByTarget(['peserta', 'semua']);
    
    // Check registration count this year
    const registrationsThisYear = await PendaftaranP4.countRegistrationsThisYear(peserta.id);
    const canRegister = registrationsThisYear < 3;
    
    // Get peserta's registrations
    const pesertaRegistrations = await PendaftaranP4.findByPesertaId(peserta.id);
    const registeredKuotaIds = pesertaRegistrations
      .filter(r => ['pending', 'approved', 'registered'].includes(r.status))
      .map(r => r.kuota_id);

    res.render('peserta/pelatihan', {
      title: 'Daftar Pelatihan Tersedia - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      kuotaList,
      registeredKuotaIds,
      registrationsThisYear,
      canRegister,
      maxRegistrations: 3,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show pelatihan list error:', error);
    req.session.error = 'Gagal memuat daftar pelatihan';
    res.redirect('/peserta/dashboard');
  }
};

// @desc    Process daftar pelatihan
// @route   POST /peserta/daftar-pelatihan/:kuotaId
const daftarPelatihan = async (req, res) => {
  try {
    const { kuotaId } = req.params;
    const peserta = await Peserta.findByUserId(req.user.id);
    
    if (!peserta) {
      req.session.error = 'Data peserta tidak ditemukan';
      return res.redirect(`/peserta/daftar-pelatihan/${kuotaId}`);
    }

    // Check registration limit
    const registrationsThisYear = await PendaftaranP4.countRegistrationsThisYear(peserta.id);
    if (registrationsThisYear >= 3) {
      req.session.error = 'Anda sudah mencapai batas maksimal pendaftaran (3x per tahun)';
      return res.redirect('/peserta/pelatihan');
    }

    const kuota = await KuotaP4.findById(kuotaId);
    
    if (!kuota) {
      req.session.error = 'Pelatihan tidak ditemukan';
      return res.redirect('/peserta/pelatihan');
    }

    // Check if target is valid
    if (!['peserta', 'semua'].includes(kuota.target_peserta)) {
      req.session.error = 'Pelatihan ini tidak tersedia untuk peserta didik';
      return res.redirect('/peserta/pelatihan');
    }

    // Check if kuota is open
    if (kuota.status !== 'open') {
      req.session.error = 'Pendaftaran sudah ditutup';
      return res.redirect('/peserta/pelatihan');
    }

    // Check if already registered
    const existing = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
    if (existing && ['pending', 'approved', 'registered'].includes(existing.status)) {
      req.session.error = 'Anda sudah terdaftar pada pelatihan ini';
      return res.redirect('/peserta/pelatihan');
    }

    // Register
    const pendaftaran = await PendaftaranP4.create(peserta.id, kuota.id);

    logger.info(`New pelatihan registration: ${req.user.email} - Kuota: ${kuota.id} - Nomor Urut: ${pendaftaran.nomor_urut}`);
    req.session.success = `Pendaftaran berhasil! Nomor urut Anda: ${pendaftaran.nomor_urut}`;
    res.redirect('/peserta/status-pendaftaran');
  } catch (error) {
    logger.error('Daftar pelatihan error:', error);
    req.session.error = error.message || 'Gagal melakukan pendaftaran';
    res.redirect('/peserta/pelatihan');
  }
};

// @desc    Show status pendaftaran
// @route   GET /peserta/status-pendaftaran
const showStatusPendaftaran = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    let pendaftaranList = [];

    if (peserta) {
      pendaftaranList = await PendaftaranP4.findByPesertaId(peserta.id);
      
      // Filter active registrations
      pendaftaranList = pendaftaranList.filter(p => 
        ['pending', 'approved', 'registered'].includes(p.status)
      );
    }

    res.render('peserta/status-pendaftaran', {
      title: 'Status Pendaftaran - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      pendaftaranList,
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

    // Only allow cancel for pending
    if (pendaftaran.status !== 'pending') {
      req.session.error = 'Hanya pendaftaran dengan status pending yang dapat dibatalkan';
      return res.redirect('/peserta/status-pendaftaran');
    }

    await PendaftaranP4.cancel(id);

    logger.info(`Pelatihan registration cancelled: ${req.user.email} - ID: ${id}`);
    req.session.success = 'Pendaftaran berhasil dibatalkan';
    res.redirect('/peserta/status-pendaftaran');
  } catch (error) {
    logger.error('Cancel pendaftaran error:', error);
    req.session.error = error.message || 'Gagal membatalkan pendaftaran';
    res.redirect('/peserta/status-pendaftaran');
  }
};

// @desc    Show riwayat pelatihan
// @route   GET /peserta/riwayat-pelatihan
const showRiwayatPelatihan = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    let riwayatList = [];

    if (peserta) {
      const pendaftaranList = await PendaftaranP4.findByPesertaId(peserta.id);
      
      // Filter completed/rejected/cancelled
      riwayatList = pendaftaranList.filter(p => 
        ['completed', 'rejected', 'cancelled'].includes(p.status)
      );
    }

    res.render('peserta/riwayat-pelatihan', {
      title: 'Riwayat Pelatihan - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      riwayatList,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show riwayat pelatihan error:', error);
    req.session.error = 'Gagal memuat riwayat pelatihan';
    res.redirect('/peserta/dashboard');
  }
};

module.exports = {
  showDaftarPelatihanPage,
  showPelatihanList,
  daftarPelatihan,
  showStatusPendaftaran,
  cancelPendaftaran,
  showRiwayatPelatihan
};