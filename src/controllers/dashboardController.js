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

// Reports page removed - functionality deleted

module.exports = {
  showAdminDashboard
};