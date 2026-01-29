// Dashboard untuk semua role
const Admin = require('../models/Admin');
const Guru = require('../models/Guru');
const Peserta = require('../models/Peserta');
const KuotaP4 = require('../models/KuotaP4');
const PendaftaranP4 = require('../models/PendaftaranP4');
const PendaftaranGuruP4 = require('../models/PendaftaranGuruP4');
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
      kuotaList
    ] = await Promise.all([
      Admin.count(),
      Guru.countByStatus('pending'),
      Guru.countByStatus('active'),
      Guru.countByStatus('reject'),
      Peserta.count(),
      KuotaP4.findAllActive()
    ]);

    // Get recent pending guru for quick action
    const pendingGurus = await Guru.findByStatus('pending');
    const recentPendingGurus = pendingGurus.slice(0, 5);

    // Get recent peserta registrations from all active kuota
    let recentRegistrations = [];
    if (kuotaList && kuotaList.length > 0) {
      for (const kuota of kuotaList) {
        const registrations = await PendaftaranP4.findByKuotaId(kuota.id);
        recentRegistrations = recentRegistrations.concat(registrations);
      }
      // Sort by created_at and take top 5
      recentRegistrations = recentRegistrations
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
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
      kuotaList: kuotaList || [],
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
      kuotaList: [],
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

    // Get registration stats per kuota for peserta and guru
    const kuotaStats = await Promise.all(
      kuotaList.map(async (kuota) => {
        const pesertaRegistered = await PendaftaranP4.countByStatus('registered', kuota.id);
        const pesertaPending = await PendaftaranP4.countByStatus('pending', kuota.id);
        const pesertaCancelled = await PendaftaranP4.countByStatus('cancelled', kuota.id);
        
        // Guru registrations
        let guruRegistered = 0;
        let guruPending = 0;
        try {
          guruRegistered = await PendaftaranGuruP4.countByKuotaAndStatus(kuota.id, 'approved');
          guruPending = await PendaftaranGuruP4.countByKuotaAndStatus(kuota.id, 'pending');
        } catch (e) {
          // Table might not exist yet
        }
        
        return {
          ...kuota,
          pesertaRegistered,
          pesertaPending,
          pesertaCancelled,
          guruRegistered,
          guruPending
        };
      })
    );

    // Calculate totals
    const totalRegistrations = kuotaStats.reduce((sum, k) => sum + k.pesertaRegistered + k.guruRegistered, 0);
    const totalPendingRegistrations = kuotaStats.reduce((sum, k) => sum + k.pesertaPending + k.guruPending, 0);

    res.render('admin/reports', {
      title: 'Laporan - P4 Jakarta',
      layout: 'layouts/admin',
      stats: {
        totalAdmin,
        totalGuruPending,
        totalGuruActive,
        totalGuruRejected,
        totalGuru: totalGuruPending + totalGuruActive + totalGuruRejected,
        totalPeserta,
        totalRegistrations,
        totalPendingRegistrations
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