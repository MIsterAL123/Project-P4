// Manajemen guru & approval
const Guru = require('../models/Guru');
const Admin = require('../models/Admin');
const User = require('../models/User');
const KuotaP4 = require('../models/KuotaP4');
const PendaftaranGuruP4 = require('../models/PendaftaranGuruP4');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// =====================================================
// ADMIN: Guru Approval Management
// =====================================================

// @desc    Show approve guru page (list pending)
// @route   GET /admin/approve-guru
const showApproveGuruPage = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const allGurus = await Guru.findByStatus(status);
    const pendingGurus = await Guru.findByStatus('pending');
    const pendingCount = pendingGurus.length;

    res.render('admin/approve-guru', {
      title: 'Approval Guru - P4 Jakarta',
      layout: 'layouts/admin',
      gurus: allGurus,
      status,
      pendingCount,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show approve guru error:', error);
    res.render('admin/approve-guru', {
      title: 'Approval Guru - P4 Jakarta',
      layout: 'layouts/admin',
      gurus: [],
      status: req.query.status || 'pending',
      pendingCount: 0,
      currentUser: req.user,
      user: req.user
    });
  }
};

// @desc    Approve guru
// @route   POST /admin/guru/:id/approve
const approveGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const guru = await Guru.findById(id);

    if (!guru) {
      req.session.error = 'Guru tidak ditemukan';
      return res.redirect('/admin/approve-guru');
    }

    if (guru.status !== 'pending') {
      req.session.error = 'Guru sudah diproses sebelumnya';
      return res.redirect('/admin/approve-guru');
    }

    // Get admin id
    const admin = await Admin.findByUserId(req.user.id);
    
    await Guru.approve(id, admin.id);

    logger.info(`Guru approved by ${req.user.email}: ${guru.email}`);
    req.session.success = `Guru ${guru.nama} berhasil disetujui`;
    res.redirect('/admin/approve-guru');
  } catch (error) {
    logger.error('Approve guru error:', error);
    req.session.error = 'Gagal menyetujui guru';
    res.redirect('/admin/approve-guru');
  }
};

// @desc    Reject guru
// @route   POST /admin/guru/:id/reject
const rejectGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const guru = await Guru.findById(id);

    if (!guru) {
      req.session.error = 'Guru tidak ditemukan';
      return res.redirect('/admin/approve-guru');
    }

    if (guru.status !== 'pending') {
      req.session.error = 'Guru sudah diproses sebelumnya';
      return res.redirect('/admin/approve-guru');
    }

    if (!reason || reason.trim() === '') {
      req.session.error = 'Alasan penolakan wajib diisi';
      return res.redirect('/admin/approve-guru');
    }

    // Get admin id
    const admin = await Admin.findByUserId(req.user.id);
    
    await Guru.reject(id, admin.id, reason);

    logger.info(`Guru rejected by ${req.user.email}: ${guru.email} - Reason: ${reason}`);
    req.session.success = `Guru ${guru.nama} telah ditolak`;
    res.redirect('/admin/approve-guru');
  } catch (error) {
    logger.error('Reject guru error:', error);
    req.session.error = 'Gagal menolak guru';
    res.redirect('/admin/approve-guru');
  }
};

// =====================================================
// GURU: Self Management
// =====================================================

// @desc    Show guru dashboard
// @route   GET /guru/dashboard
const showDashboard = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);
    
    // Get guru's recent registrations
    const pendaftaranList = await PendaftaranGuruP4.findByGuru(guru.id);
    const recentPendaftaran = pendaftaranList.slice(0, 5);
    
    // Count registrations this year
    const registrationsThisYear = await PendaftaranGuruP4.countRegistrationsThisYear(guru.id);

    res.render('guru/dashboard', {
      title: 'Dashboard Pendidik - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      recentPendaftaran,
      registrationsThisYear,
      maxRegistrations: 3,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show guru dashboard error:', error);
    req.session.error = 'Gagal memuat dashboard';
    res.redirect('/');
  }
};

// @desc    Show guru profile
// @route   GET /guru/profile
const showProfile = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);

    res.render('guru/profile', {
      title: 'Profil Pendidik - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      currentUser: req.user,
      success: req.session.success,
      error: req.session.error
    });
    
    // Clear flash messages after rendering
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    logger.error('Show guru profile error:', error);
    req.session.error = 'Gagal memuat profil';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Show daftar pelatihan list page
// @route   GET /guru/daftar-pelatihan
const showDaftarPelatihan = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);
    
    // Check registration count this year
    const registrationsThisYear = await PendaftaranGuruP4.countRegistrationsThisYear(guru.id);
    const canRegister = registrationsThisYear < 3;
    
    // Get available pelatihan (target guru or semua)
    const kuotaList = await KuotaP4.findByTarget(['guru', 'semua']);
    
    // Filter out already registered
    const guruRegistrations = await PendaftaranGuruP4.findByGuru(guru.id);
    const registeredKuotaIds = guruRegistrations
      .filter(r => ['pending', 'approved'].includes(r.status))
      .map(r => r.kuota_id);
    
    const availableKuota = kuotaList.filter(k => !registeredKuotaIds.includes(k.id));

    res.render('guru/daftar-pelatihan', {
      title: 'Daftar Pelatihan Tersedia - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      kuotaList: availableKuota,
      registrationsThisYear,
      canRegister,
      maxRegistrations: 3,
      currentUser: req.user,
      success: req.session.success,
      error: req.session.error
    });
    
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    logger.error('Show daftar pelatihan error:', error);
    req.session.error = 'Gagal memuat daftar pelatihan';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Show konfirmasi pendaftaran page (detail pelatihan)
// @route   GET /guru/daftar-pelatihan/:kuotaId
const showKonfirmasiPendaftaran = async (req, res) => {
  try {
    const { kuotaId } = req.params;
    const guru = await Guru.findByUserId(req.user.id);
    
    // Get specific kuota
    const kuota = await KuotaP4.findById(kuotaId);
    
    if (!kuota) {
      req.session.error = 'Pelatihan tidak ditemukan';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Check if target is for guru or semua
    if (!['guru', 'semua'].includes(kuota.target_peserta)) {
      req.session.error = 'Pelatihan ini tidak tersedia untuk pendidik';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Check registration count this year
    const registrationsThisYear = await PendaftaranGuruP4.countRegistrationsThisYear(guru.id);
    const canRegister = registrationsThisYear < 3;
    
    // Check if already registered for this kuota
    let pendaftaran = null;
    let alreadyRegistered = false;
    
    if (guru && kuota) {
      pendaftaran = await PendaftaranGuruP4.findByGuruAndKuota(guru.id, kuota.id);
      alreadyRegistered = pendaftaran && ['pending', 'approved'].includes(pendaftaran.status);
    }

    res.render('guru/konfirmasi-pendaftaran', {
      title: 'Konfirmasi Pendaftaran - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      kuota,
      pendaftaran,
      alreadyRegistered,
      registrationsThisYear,
      canRegister,
      maxRegistrations: 3,
      currentUser: req.user,
      error: req.session.error
    });
    
    delete req.session.error;
  } catch (error) {
    logger.error('Show konfirmasi pendaftaran page error:', error);
    req.session.error = 'Gagal memuat halaman pendaftaran';
    res.redirect('/guru/daftar-pelatihan');
  }
};

// @desc    Process konfirmasi pendaftaran (create registration with surat tugas)
// @route   POST /guru/konfirmasi-pendaftaran/:kuotaId
const prosesPendaftaran = async (req, res) => {
  try {
    const { kuotaId } = req.params;
    const guru = await Guru.findByUserId(req.user.id);
    
    if (!guru) {
      req.session.error = 'Data guru tidak ditemukan';
      return res.redirect(`/guru/daftar-pelatihan/${kuotaId}`);
    }

    // Check registration limit
    const registrationsThisYear = await PendaftaranGuruP4.countRegistrationsThisYear(guru.id);
    if (registrationsThisYear >= 3) {
      req.session.error = 'Anda sudah mencapai batas maksimal pendaftaran (3x per tahun)';
      return res.redirect('/guru/daftar-pelatihan');
    }

    const kuota = await KuotaP4.findById(kuotaId);
    
    if (!kuota) {
      req.session.error = 'Pelatihan tidak ditemukan';
      return res.redirect('/guru/daftar-pelatihan');
    }

    // Check if target is valid
    if (!['guru', 'semua'].includes(kuota.target_peserta)) {
      req.session.error = 'Pelatihan ini tidak tersedia untuk pendidik';
      return res.redirect('/guru/daftar-pelatihan');
    }

    // Check if kuota is open
    if (kuota.status !== 'open') {
      req.session.error = 'Pendaftaran sudah ditutup';
      return res.redirect('/guru/daftar-pelatihan');
    }

    // Check if already registered
    const existing = await PendaftaranGuruP4.findByGuruAndKuota(guru.id, kuota.id);
    if (existing && ['pending', 'approved'].includes(existing.status)) {
      req.session.error = 'Anda sudah terdaftar pada pelatihan ini';
      return res.redirect('/guru/daftar-pelatihan');
    }

    // Create registration (no file required at this stage)
    const pendaftaranData = {
      guru_id: guru.id,
      kuota_id: kuota.id
    };
    
    const pendaftaran = await PendaftaranGuruP4.create(pendaftaranData);

    logger.info(`Guru ${guru.id} registered for pelatihan ${kuota.id} (pending approval)`);

    logger.info(`Guru ${guru.id} registered for pelatihan ${kuota.id} with surat tugas`);
    req.session.success = `Pendaftaran Anda untuk pelatihan "${kuota.judul_pelatihan || 'Pelatihan ' + kuota.tahun_ajaran}" telah berhasil diajukan.`;
    res.redirect('/guru/status-pendaftaran');
  } catch (error) {
    logger.error('Proses pendaftaran error:', error);
    req.session.error = error.message || 'Gagal melakukan pendaftaran';
    res.redirect('/guru/daftar-pelatihan');
  }
};

// @desc    Show upload surat tugas page
// @route   GET /guru/upload-surat-tugas/:pendaftaranId
const showUploadSuratTugas = async (req, res) => {
  try {
    const { pendaftaranId } = req.params;
    const guru = await Guru.findByUserId(req.user.id);
    
    const pendaftaran = await PendaftaranGuruP4.findById(pendaftaranId);
    
    if (!pendaftaran) {
      req.session.error = 'Pendaftaran tidak ditemukan';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    // Check ownership
    if (pendaftaran.guru_id !== guru.id) {
      req.session.error = 'Anda tidak memiliki akses ke halaman ini';
      return res.redirect('/guru/status-pendaftaran');
    }

    // Only allow upload if registration is approved by admin
    if (pendaftaran.status !== 'approved') {
      req.session.error = 'Upload hanya tersedia setelah pendaftaran disetujui oleh admin';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    // Get kuota info
    const kuota = await KuotaP4.findById(pendaftaran.kuota_id);
    
    res.render('guru/upload-surat-tugas', {
      title: 'Upload Surat Tugas - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      pendaftaran,
      kuota,
      currentUser: req.user,
      success: req.session.success,
      error: req.session.error
    });
    
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    logger.error('Show upload surat tugas error:', error);
    req.session.error = 'Gagal memuat halaman upload';
    res.redirect('/guru/status-pendaftaran');
  }
};

// @desc    Process upload surat tugas
// @route   POST /guru/upload-surat-tugas/:pendaftaranId
const uploadSuratTugas = async (req, res) => {
  try {
    const { pendaftaranId } = req.params;
    const guru = await Guru.findByUserId(req.user.id);
    
    const pendaftaran = await PendaftaranGuruP4.findById(pendaftaranId);
    
    if (!pendaftaran) {
      req.session.error = 'Pendaftaran tidak ditemukan';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    // Check ownership
    if (pendaftaran.guru_id !== guru.id) {
      req.session.error = 'Anda tidak memiliki akses ke halaman ini';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    // Check if file uploaded
    if (!req.file) {
      req.session.error = 'File surat tugas wajib diunggah';
      return res.redirect(`/guru/upload-surat-tugas/${pendaftaranId}`);
    }

    // Delete old file if exists
    if (pendaftaran.surat_tugas) {
      const oldFilePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'surat_tugas', pendaftaran.surat_tugas);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update pendaftaran with surat tugas and set status 'surat_terkirim'
    await PendaftaranGuruP4.updateSuratTugas(pendaftaranId, req.file.filename);
    
    logger.info(`Surat tugas uploaded for pendaftaran ${pendaftaranId}`);
    req.session.success = 'Surat tugas berhasil diunggah.';
    res.redirect('/guru/status-pendaftaran');
  } catch (error) {
    logger.error('Upload surat tugas error:', error);
    req.session.error = 'Gagal mengunggah surat tugas';
    res.redirect(`/guru/upload-surat-tugas/${req.params.pendaftaranId}`);
  }
};

// @desc    Process pelatihan registration (OLD - DEPRECATED)
// @route   POST /guru/daftar-pelatihan
const daftarPelatihan = async (req, res) => {
  try {
    const { kuota_id } = req.body;
    const guru = await Guru.findByUserId(req.user.id);
    
    // Check registration limit
    const registrationsThisYear = await PendaftaranGuruP4.countRegistrationsThisYear(guru.id);
    if (registrationsThisYear >= 3) {
      req.session.error = 'Anda sudah mencapai batas maksimal pendaftaran (3x per tahun)';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Check if kuota exists and valid for guru
    const kuota = await KuotaP4.findById(kuota_id);
    if (!kuota) {
      req.session.error = 'Pelatihan tidak ditemukan';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    if (!['guru', 'semua'].includes(kuota.target_peserta)) {
      req.session.error = 'Pelatihan ini tidak tersedia untuk pendidik';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Check if already registered
    const existingReg = await PendaftaranGuruP4.findByGuruAndKuota(guru.id, kuota_id);
    if (existingReg && ['pending', 'approved'].includes(existingReg.status)) {
      req.session.error = 'Anda sudah terdaftar pada pelatihan ini';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Check surat tugas file
    if (!req.file) {
      req.session.error = 'Surat tugas wajib diunggah';
      return res.redirect('/guru/daftar-pelatihan');
    }
    
    // Create registration
    const pendaftaranData = {
      guru_id: guru.id,
      kuota_id: kuota_id,
      surat_tugas: req.file.filename
    };
    
    await PendaftaranGuruP4.create(pendaftaranData);
    
    logger.info(`Guru ${guru.id} registered for pelatihan ${kuota_id}`);
    req.session.success = 'Pendaftaran pelatihan berhasil diajukan';
    res.redirect('/guru/status-pendaftaran');
  } catch (error) {
    logger.error('Daftar pelatihan error:', error);
    req.session.error = 'Gagal mendaftar pelatihan';
    res.redirect('/guru/daftar-pelatihan');
  }
};

// @desc    Show status pendaftaran
// @route   GET /guru/status-pendaftaran
const showStatusPendaftaran = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);
    const pendaftaranList = await PendaftaranGuruP4.findByGuru(guru.id);
    
    // Filter active registrations (pending, approved, document submitted)
    const activePendaftaran = pendaftaranList.filter(p => 
      ['pending', 'approved', 'surat_terkirim'].includes(p.status)
    );

    res.render('guru/status-pendaftaran', {
      title: 'Status Pendaftaran - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      pendaftaranList: activePendaftaran,
      currentUser: req.user,
      success: req.session.success,
      error: req.session.error
    });
    
    delete req.session.success;
    delete req.session.error;
  } catch (error) {
    logger.error('Show status pendaftaran error:', error);
    req.session.error = 'Gagal memuat status pendaftaran';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Cancel pendaftaran
// @route   POST /guru/pendaftaran/:id/cancel
const cancelPendaftaran = async (req, res) => {
  try {
    const { id } = req.params;
    const guru = await Guru.findByUserId(req.user.id);
    
    const pendaftaran = await PendaftaranGuruP4.findById(id);
    
    if (!pendaftaran) {
      req.session.error = 'Pendaftaran tidak ditemukan';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    if (pendaftaran.guru_id !== guru.id) {
      req.session.error = 'Anda tidak berhak membatalkan pendaftaran ini';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    if (pendaftaran.status !== 'pending') {
      req.session.error = 'Hanya pendaftaran dengan status pending yang dapat dibatalkan';
      return res.redirect('/guru/status-pendaftaran');
    }
    
    await PendaftaranGuruP4.updateStatus(id, 'cancelled');
    
    // Delete surat tugas file
    if (pendaftaran.surat_tugas) {
      const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'surat_tugas', pendaftaran.surat_tugas);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    logger.info(`Pendaftaran ${id} cancelled by guru ${guru.id}`);
    req.session.success = 'Pendaftaran berhasil dibatalkan';
    res.redirect('/guru/status-pendaftaran');
  } catch (error) {
    logger.error('Cancel pendaftaran error:', error);
    req.session.error = 'Gagal membatalkan pendaftaran';
    res.redirect('/guru/status-pendaftaran');
  }
};

// @desc    Show riwayat pelatihan
// @route   GET /guru/riwayat-pelatihan
const showRiwayatPelatihan = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);
    const pendaftaranList = await PendaftaranGuruP4.findByGuru(guru.id);
    
    // Filter completed/rejected registrations
    const riwayatPendaftaran = pendaftaranList.filter(p => 
      ['completed', 'rejected', 'cancelled'].includes(p.status)
    );

    res.render('guru/riwayat-pelatihan', {
      title: 'Riwayat Pelatihan - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      riwayatList: riwayatPendaftaran,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show riwayat pelatihan error:', error);
    req.session.error = 'Gagal memuat riwayat pelatihan';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Update guru profile
// @route   POST /guru/profile/update
const updateProfile = async (req, res) => {
  try {
    const { nama, email, nip, link_dokumen, sekolah_asal } = req.body;
    const guru = await Guru.findByUserId(req.user.id);

    if (!guru) {
      req.session.error = 'Data guru tidak ditemukan';
      return res.redirect('/guru/profile');
    }

    // Validation
    const errors = [];

    if (!nama || nama.length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }
    if (!nip || nip.length < 10) {
      errors.push('NIP minimal 10 karakter');
    }
    if (!sekolah_asal || sekolah_asal.trim() === '') {
      errors.push('Asal sekolah harus diisi');
    }

    // Check email uniqueness
    if (email !== guru.email && await User.emailExists(email)) {
      errors.push('Email sudah digunakan');
    }

    // Check NIP uniqueness (exclude current guru)
    if (nip !== guru.nip && await Guru.nipExists(nip, guru.id)) {
      errors.push('NIP sudah digunakan');
    }

    if (errors.length > 0) {
      return res.render('guru/profile', {
        title: 'Profil Pendidik - P4 Jakarta',
        layout: 'layouts/admin',
        guru,
        currentUser: req.user,
        errors
      });
    }

    await Guru.update(guru.id, { nama, email, nip, link_dokumen, sekolah_asal });

    // Update session
    req.session.user.nama = nama;
    req.session.user.email = email;

    logger.info(`Guru profile updated: ${email}`);
    req.session.success = 'Profil berhasil diperbarui';
    res.redirect('/guru/profile');
  } catch (error) {
    logger.error('Update guru profile error:', error);
    req.session.error = 'Gagal memperbarui profil';
    res.redirect('/guru/profile');
  }
};

// @desc    Change password
// @route   POST /guru/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    // Validation
    const errors = [];

    if (!current_password) {
      errors.push('Password saat ini wajib diisi');
    }
    if (!new_password || new_password.length < 8) {
      errors.push('Password baru minimal 8 karakter');
    }
    if (new_password !== confirm_password) {
      errors.push('Konfirmasi password tidak cocok');
    }

    // Verify current password
    const user = await User.findById(req.user.id);
    const isMatch = await User.verifyPassword(current_password, user.password);
    if (!isMatch) {
      errors.push('Password saat ini salah');
    }

    if (errors.length > 0) {
      const guru = await Guru.findByUserId(req.user.id);
      return res.render('guru/profile', {
        title: 'Profil Pendidik - P4 Jakarta',
        layout: 'layouts/admin',
        guru,
        currentUser: req.user,
        errors,
        activeTab: 'password'
      });
    }

    await User.updatePassword(req.user.id, new_password);

    logger.info(`Guru password changed: ${req.user.email}`);
    req.session.success = 'Password berhasil diubah';
    res.redirect('/guru/profile');
  } catch (error) {
    logger.error('Change password error:', error);
    req.session.error = 'Gagal mengubah password';
    res.redirect('/guru/profile');
  }
};

module.exports = {
  // Admin functions
  showApproveGuruPage,
  approveGuru,
  rejectGuru,
  // Guru functions
  showDashboard,
  showProfile,
  showDaftarPelatihan,
  showKonfirmasiPendaftaran,
  prosesPendaftaran,
  showUploadSuratTugas,
  uploadSuratTugas,
  daftarPelatihan, // Deprecated - kept for backward compatibility
  showStatusPendaftaran,
  cancelPendaftaran,
  showRiwayatPelatihan,
  updateProfile,
  changePassword
};