// Dashboard untuk semua role
const Admin = require('../models/Admin');
const Guru = require('../models/Guru');
const Peserta = require('../models/Peserta');
const KuotaP4 = require('../models/KuotaP4');
const PendaftaranP4 = require('../models/PendaftaranP4');
const logger = require('../utils/logger');

// @desc    Show admin dashboard
// @route   GET /admin/dashboard
const showAdminDashboard = async (req, res) => {
  try {
    // Get statistics
    const [
      totalAdmin,
      totalGuruPending,
      totalGuruActive,
      totalGuruRejected,
      totalPeserta,
      activeKuota
    ] = await Promise.all([
      Admin.count(),
      Guru.countByStatus('pending'),
      Guru.countByStatus('active'),
      Guru.countByStatus('reject'),
      Peserta.count(),
      KuotaP4.findActiveKuota()
    ]);

    // Get recent pending guru for quick action
    const pendingGurus = await Guru.findByStatus('pending');
    const recentPendingGurus = pendingGurus.slice(0, 5);

    // Get recent peserta registrations
    let recentRegistrations = [];
    if (activeKuota) {
      const allRegistrations = await PendaftaranP4.findByKuotaId(activeKuota.id);
      recentRegistrations = allRegistrations.slice(0, 5);
    }

    res.render('admin/dashboard', {
      title: 'Dashboard Admin - P4 Jakarta',
      layout: 'layouts/admin',
      stats: {
        totalAdmin,
        totalGuruPending,
        totalGuruActive,
        totalGuruRejected,
        totalGuru: totalGuruPending + totalGuruActive + totalGuruRejected,
        totalPeserta,
        pendingGuru: totalGuruPending
      },
      kuotaAktif: activeKuota,
      pendingGurus: recentPendingGurus,
      recentPendaftaran: recentRegistrations,
      user: req.user,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show admin dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Dashboard Admin - P4 Jakarta',
      layout: 'layouts/admin',
      stats: {
        totalAdmin: 0,
        totalGuru: 0,
        totalPeserta: 0,
        pendingGuru: 0
      },
      kuotaAktif: null,
      pendingGurus: [],
      recentPendaftaran: [],
      user: req.user,
      currentUser: req.user
    });
  }
};

// @desc    Show admin reports page
// @route   GET /admin/reports
const showReportsPage = async (req, res) => {
  try {
    const [
      totalAdmin,
      totalGuruPending,
      totalGuruActive,
      totalGuruRejected,
      totalPeserta,
      kuotaList
    ] = await Promise.all([
      Admin.count(),
      Guru.countByStatus('pending'),
      Guru.countByStatus('active'),
      Guru.countByStatus('reject'),
      Peserta.count(),
      KuotaP4.findAll()
    ]);

    // Get registration stats per kuota
    const kuotaStats = await Promise.all(
      kuotaList.map(async (kuota) => {
        const registered = await PendaftaranP4.countByStatus('registered', kuota.id);
        const cancelled = await PendaftaranP4.countByStatus('cancelled', kuota.id);
        return {
          ...kuota,
          registered,
          cancelled
        };
      })
    );

    res.render('admin/reports', {
      title: 'Laporan - P4 Jakarta',
      layout: 'layouts/admin',
      stats: {
        totalAdmin,
        totalGuruPending,
        totalGuruActive,
        totalGuruRejected,
        totalPeserta
      },
      kuotaStats,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show reports page error:', error);
    req.session.error = 'Gagal memuat laporan';
    res.redirect('/admin/dashboard');
  }
};

module.exports = {
  showAdminDashboard,
  showReportsPage
};