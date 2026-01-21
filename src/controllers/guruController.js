// Manajemen guru & approval
const Guru = require('../models/Guru');
const Admin = require('../models/Admin');
const User = require('../models/User');
const logger = require('../utils/logger');

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

    res.render('guru/dashboard', {
      title: 'Dashboard Guru - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
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
      title: 'Profil Guru - P4 Jakarta',
      layout: 'layouts/admin',
      guru,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show guru profile error:', error);
    req.session.error = 'Gagal memuat profil';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Show materials page
// @route   GET /guru/materials
const showMaterials = async (req, res) => {
  try {
    const guru = await Guru.findByUserId(req.user.id);
    const Material = require('../models/Material');
    const materials = await Material.findByGuru(guru.id);

    res.render('guru/materials', {
      title: 'Materi Pelatihan - P4 Jakarta',
      layout: 'layouts/admin',
      user: req.user,
      currentUser: req.user,
      guru,
      materials
    });
  } catch (error) {
    logger.error('Show materials error:', error);
    req.session.error = 'Gagal memuat materi';
    res.redirect('/guru/dashboard');
  }
};

// @desc    Upload material
// @route   POST /guru/materials/upload
const uploadMaterial = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;
    const guru = await Guru.findByUserId(req.user.id);
    const Material = require('../models/Material');

    const errors = [];
    if (!title || title.trim().length < 3) errors.push('Judul minimal 3 karakter');
    if (!file) errors.push('File materi wajib diunggah');

    if (errors.length > 0) {
      req.session.error = errors.join('; ');
      return res.redirect('/guru/materials');
    }

    const filePath = `/uploads/materials/${file.filename}`;
    const fileType = file.originalname.split('.').pop().toLowerCase();

    await Material.create({
      guru_id: guru.id,
      title: title.trim(),
      description: description || null,
      file_path: file.filename,
      file_type: fileType
    });

    logger.info(`Material uploaded by guru ${guru.id}: ${file.filename}`);
    req.session.success = 'Materi berhasil diunggah';
    res.redirect('/guru/materials');
  } catch (error) {
    logger.error('Upload material error:', error);
    req.session.error = 'Gagal mengunggah materi';
    res.redirect('/guru/materials');
  }
};

// @desc    Delete material
// @route   POST /guru/materials/:id/delete
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const Material = require('../models/Material');
    const material = await Material.findById(id);
    const guru = await Guru.findByUserId(req.user.id);

    if (!material) {
      req.session.error = 'Materi tidak ditemukan';
      return res.redirect('/guru/materials');
    }

    if (material.guru_id !== guru.id) {
      req.session.error = 'Anda tidak berhak menghapus materi ini';
      return res.redirect('/guru/materials');
    }

    // Remove file from disk
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'materials', material.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Material.delete(id);
    logger.info(`Material deleted by guru ${guru.id}: ${material.file_path}`);
    req.session.success = 'Materi berhasil dihapus';
    res.redirect('/guru/materials');
  } catch (error) {
    logger.error('Delete material error:', error);
    req.session.error = 'Gagal menghapus materi';
    res.redirect('/guru/materials');
  }
};

// @desc    Update guru profile
// @route   POST /guru/profile/update
const updateProfile = async (req, res) => {
  try {
    const { nama, email, nip, link_dokumen } = req.body;
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

    // Check email uniqueness
    if (email !== guru.email && await User.emailExists(email)) {
      errors.push('Email sudah digunakan');
    }

    // Check NIP uniqueness
    if (nip !== guru.nip && await Guru.nipExists(nip)) {
      errors.push('NIP sudah digunakan');
    }

    if (errors.length > 0) {
      return res.render('guru/profile', {
        title: 'Profil Guru - P4 Jakarta',
        layout: 'layouts/admin',
        guru,
        currentUser: req.user,
        errors
      });
    }

    await Guru.update(guru.id, { nama, email, nip, link_dokumen });

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
        title: 'Profil Guru - P4 Jakarta',
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

// @desc    Show students list (peserta)
// @route   GET /guru/students
const showStudents = async (req, res) => {
  try {
    const Peserta = require('../models/Peserta');
    const pesertaList = await Peserta.findAllWithPendaftaran();

    res.render('guru/students', {
      title: 'Daftar Peserta - P4 Jakarta',
      layout: 'layouts/admin',
      students: pesertaList,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show students error:', error);
    req.session.error = 'Gagal memuat daftar peserta';
    res.redirect('/guru/dashboard');
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
  showMaterials,
  uploadMaterial,
  deleteMaterial,
  updateProfile,
  changePassword,
  showStudents
};