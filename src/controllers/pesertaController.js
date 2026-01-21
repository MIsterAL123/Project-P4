// Manajemen peserta
const Peserta = require('../models/Peserta');
const User = require('../models/User');
const PendaftaranP4 = require('../models/PendaftaranP4');
const KuotaP4 = require('../models/KuotaP4');
const logger = require('../utils/logger');

// =====================================================
// ADMIN: Peserta Management
// =====================================================

// @desc    Show manage peserta page
// @route   GET /admin/manage-peserta
const showManagePesertaPage = async (req, res) => {
  try {
    const pesertaList = await Peserta.findAllWithPendaftaran();
    const kuota = await KuotaP4.findActiveKuota();

    res.render('admin/manage-peserta', {
      title: 'Kelola Peserta - P4 Jakarta',
      layout: 'layouts/admin',
      pesertas: pesertaList,
      kuota,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show manage peserta error:', error);
    res.render('admin/manage-peserta', {
      title: 'Kelola Peserta - P4 Jakarta',
      layout: 'layouts/admin',
      pesertas: [],
      kuota: null,
      currentUser: req.user,
      user: req.user
    });
  }
};

// @desc    View peserta detail
// @route   GET /admin/peserta/:id
const viewPesertaDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const peserta = await Peserta.findById(id);

    if (!peserta) {
      req.session.error = 'Peserta tidak ditemukan';
      return res.redirect('/admin/manage-peserta');
    }

    const pendaftaran = await PendaftaranP4.findByPesertaId(id);

    res.render('admin/peserta-detail', {
      title: `Detail Peserta - ${peserta.nama}`,
      layout: 'layouts/admin',
      peserta,
      pendaftaran,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('View peserta detail error:', error);
    req.session.error = 'Gagal memuat detail peserta';
    res.redirect('/admin/manage-peserta');
  }
};

// =====================================================
// PESERTA: Self Management
// =====================================================

// @desc    Show peserta dashboard
// @route   GET /peserta/dashboard
const showDashboard = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);
    const kuota = await KuotaP4.findActiveKuota();
    let pendaftaran = null;

    if (peserta && kuota) {
      pendaftaran = await PendaftaranP4.findByPesertaAndKuota(peserta.id, kuota.id);
    }

    res.render('peserta/dashboard', {
      title: 'Dashboard Peserta - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      kuota,
      pendaftaran,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show peserta dashboard error:', error);
    req.session.error = 'Gagal memuat dashboard';
    res.redirect('/');
  }
};

// @desc    Show peserta profile
// @route   GET /peserta/profile
const showProfile = async (req, res) => {
  try {
    const peserta = await Peserta.findByUserId(req.user.id);

    res.render('peserta/profile', {
      title: 'Profil Peserta - P4 Jakarta',
      layout: 'layouts/admin',
      peserta,
      currentUser: req.user
    });
  } catch (error) {
    logger.error('Show peserta profile error:', error);
    req.session.error = 'Gagal memuat profil';
    res.redirect('/peserta/dashboard');
  }
};

// @desc    Update peserta profile
// @route   POST /peserta/profile/update
const updateProfile = async (req, res) => {
  try {
    const { nama, email, nik, link_dokumen } = req.body;
    const peserta = await Peserta.findByUserId(req.user.id);

    if (!peserta) {
      req.session.error = 'Data peserta tidak ditemukan';
      return res.redirect('/peserta/profile');
    }

    // Validation
    const errors = [];

    if (!nama || nama.length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }
    if (!nik || nik.length !== 16) {
      errors.push('NIK harus 16 digit');
    }

    // Check email uniqueness
    if (email !== peserta.email && await User.emailExists(email)) {
      errors.push('Email sudah digunakan');
    }

    // Check NIK uniqueness
    if (nik !== peserta.nik && await Peserta.nikExists(nik)) {
      errors.push('NIK sudah digunakan');
    }

    if (errors.length > 0) {
      return res.render('peserta/profile', {
        title: 'Profil Peserta - P4 Jakarta',
        layout: 'layouts/admin',
        peserta,
        currentUser: req.user,
        errors
      });
    }

    await Peserta.update(peserta.id, { nama, email, nik, link_dokumen });

    // Update session
    req.session.user.nama = nama;
    req.session.user.email = email;

    logger.info(`Peserta profile updated: ${email}`);
    req.session.success = 'Profil berhasil diperbarui';
    res.redirect('/peserta/profile');
  } catch (error) {
    logger.error('Update peserta profile error:', error);
    req.session.error = 'Gagal memperbarui profil';
    res.redirect('/peserta/profile');
  }
};

// @desc    Delete peserta (admin)
// @route   POST /admin/manage-peserta/:id/delete
const deletePeserta = async (req, res) => {
  try {
    const { id } = req.params;
    const peserta = await Peserta.findById(id);

    if (!peserta) {
      req.session.error = 'Peserta tidak ditemukan';
      return res.redirect('/admin/manage-peserta');
    }

    await Peserta.delete(id);

    logger.info(`Peserta deleted by ${req.user.email}: ID ${id}`);
    req.session.success = 'Peserta berhasil dihapus';
    res.redirect('/admin/manage-peserta');
  } catch (error) {
    logger.error('Delete peserta error:', error);
    req.session.error = 'Gagal menghapus peserta';
    res.redirect('/admin/manage-peserta');
  }
};

// @desc    Change password
// @route   POST /peserta/change-password
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
      const peserta = await Peserta.findByUserId(req.user.id);
      return res.render('peserta/profile', {
        title: 'Profil Peserta - P4 Jakarta',
        layout: 'layouts/admin',
        peserta,
        currentUser: req.user,
        errors,
        activeTab: 'password'
      });
    }

    await User.updatePassword(req.user.id, new_password);

    logger.info(`Peserta password changed: ${req.user.email}`);
    req.session.success = 'Password berhasil diubah';
    res.redirect('/peserta/profile');
  } catch (error) {
    logger.error('Change password error:', error);
    req.session.error = 'Gagal mengubah password';
    res.redirect('/peserta/profile');
  }
};

module.exports = {
  // Admin functions
  showManagePesertaPage,
  viewPesertaDetail,
  deletePeserta,
  // Peserta functions
  showDashboard,
  showProfile,
  updateProfile,
  changePassword
};