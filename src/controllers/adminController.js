// Manajemen admin
const Admin = require('../models/Admin');
const User = require('../models/User');
const logger = require('../utils/logger');
const PendaftaranP4 = require('../models/PendaftaranP4');
const KuotaP4 = require('../models/KuotaP4');

// Helper: determine Super Admin (configurable via env)
const isSuperAdmin = (req) => {
  if (!req.user) return false;
  if (req.user.is_super) return true; // optional flag on session/user
  if (process.env.SUPERADMIN_EMAIL && req.user.email === process.env.SUPERADMIN_EMAIL) return true;
  if (process.env.SUPERADMIN_ID && String(req.user.id) === String(process.env.SUPERADMIN_ID)) return true;
  return false;
};

// @desc    Show manage admin page
// @route   GET /admin/manage-admin
const showManageAdminPage = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    const superAdmin = isSuperAdmin(req);

    res.render('admin/manage-admin', {
      title: 'Kelola Admin - P4 Jakarta',
      layout: 'layouts/admin',
      admins,
      currentUser: req.user,
      user: req.user,
      isSuper: superAdmin
    });
  } catch (error) {
    logger.error('Show manage admin error:', error);
    res.render('admin/manage-admin', {
      title: 'Kelola Admin - P4 Jakarta',
      layout: 'layouts/admin',
      admins: [],
      currentUser: req.user,
      user: req.user,
      isSuper: isSuperAdmin(req)
    });
  }
};

// @desc    Add new admin
// @route   POST /admin/add-admin
const addAdmin = async (req, res) => {
  try {
    const { nama, email, password, confirm_password } = req.body;

    // Only Super Admin can add admins
    if (!isSuperAdmin(req)) {
      req.session.error = 'Akses ditolak: hanya Super Admin yang dapat menambah admin';
      return res.redirect('/admin/manage-admin');
    }

    // Validation
    const errors = [];

    if (!nama || nama.length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }
    if (!password || password.length < 8) {
      errors.push('Password minimal 8 karakter');
    }
    if (password !== confirm_password) {
      errors.push('Password tidak cocok');
    }

    // Check if email exists
    if (await User.emailExists(email)) {
      errors.push('Email sudah terdaftar');
    }

    if (errors.length > 0) {
      const admins = await Admin.findAll();
      return res.render('admin/manage-admin', {
        title: 'Kelola Admin - P4 Jakarta',
        layout: 'layouts/admin',
        admins,
        currentUser: req.user,
        errors,
        formData: { nama, email, no_hp: req.body.no_hp, is_active: req.body.is_active }
      });
    }

    // Get current admin id
    const currentAdmin = await Admin.findByUserId(req.user.id);

    // Create new admin (include phone and active flag)
    const no_hp = req.body.no_hp || null;
    const is_active = typeof req.body.is_active !== 'undefined' ? (req.body.is_active === '1' ? 1 : 0) : 1;

    await Admin.create({ nama, email, password, no_hp, is_active }, currentAdmin.id);

    logger.info(`New admin added by ${req.user.email}: ${email}`);
    req.session.success = 'Admin baru berhasil ditambahkan';
    res.redirect('/admin/manage-admin');
  } catch (error) {
    logger.error('Add admin error:', error);
    req.session.error = 'Gagal menambahkan admin';
    res.redirect('/admin/manage-admin');
  }
};

// @desc    Delete admin
// @route   POST /admin/delete-admin/:id
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Only Super Admin can delete admins
    if (!isSuperAdmin(req)) {
      req.session.error = 'Akses ditolak: hanya Super Admin yang dapat menghapus admin';
      return res.redirect('/admin/manage-admin');
    }

    const admin = await Admin.findById(id);

    if (!admin) {
      req.session.error = 'Admin tidak ditemukan';
      return res.redirect('/admin/manage-admin');
    }

    // Prevent self-deletion
    if (admin.user_id === req.user.id) {
      req.session.error = 'Tidak dapat menghapus akun sendiri';
      return res.redirect('/admin/manage-admin');
    }

    await Admin.delete(id);

    logger.info(`Admin deleted by ${req.user.email}: ID ${id}`);
    req.session.success = 'Admin berhasil dihapus';
    res.redirect('/admin/manage-admin');
  } catch (error) {
    logger.error('Delete admin error:', error);
    req.session.error = 'Gagal menghapus admin';
    res.redirect('/admin/manage-admin');
  }
};

// @desc    Update admin
// @route   POST /admin/update-admin/:id
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, confirm_password } = req.body;

    // Only Super Admin can update admins
    if (!isSuperAdmin(req)) {
      req.session.error = 'Akses ditolak: hanya Super Admin yang dapat mengubah admin';
      return res.redirect('/admin/manage-admin');
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      req.session.error = 'Admin tidak ditemukan';
      return res.redirect('/admin/manage-admin');
    }

    // Validation
    const errors = [];

    if (!nama || nama.length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }

    // Check if email exists for other users
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== admin.user_id) {
      errors.push('Email sudah digunakan oleh user lain');
    }

    // Password validation (optional)
    if (password && password.length > 0) {
      if (password.length < 8) {
        errors.push('Password minimal 8 karakter');
      }
      if (password !== confirm_password) {
        errors.push('Password tidak cocok');
      }
    }

    if (errors.length > 0) {
      const admins = await Admin.findAll();
      return res.render('admin/manage-admin', {
        title: 'Kelola Admin - P4 Jakarta',
        layout: 'layouts/admin',
        admins,
        currentUser: req.user,
        user: req.user,
        errors,
        formData: { id, nama, email, no_hp: req.body.no_hp }
      });
    }

    // Update admin data (include phone & active flag)
    const no_hp = req.body.no_hp || null;
    const is_active = typeof req.body.is_active !== 'undefined' ? (req.body.is_active === '1' ? 1 : 0) : undefined;

    await Admin.update(id, { nama, email, no_hp, is_active });

    // Update password if provided
    if (password && password.length > 0) {
      await User.updatePassword(admin.user_id, password);
    }

    logger.info(`Admin updated by ${req.user.email}: ID ${id}`);
    req.session.success = 'Admin berhasil diperbarui';
    res.redirect('/admin/manage-admin');
  } catch (error) {
    logger.error('Update admin error:', error);
    req.session.error = 'Gagal memperbarui admin';
    res.redirect('/admin/manage-admin');
  }
};

// @desc    Show all pendaftaran (admin view)
// @route   GET /admin/pendaftaran
const showPendaftaranPage = async (req, res) => {
  try {
    const kuota = await KuotaP4.findActiveKuota();
    let registrations = [];
    if (kuota) {
      registrations = await PendaftaranP4.findByKuotaId(kuota.id);
    } else {
      registrations = await PendaftaranP4.findAll();
    }

    res.render('admin/pendaftaran', {
      title: 'Pendaftaran P4 - P4 Jakarta',
      layout: 'layouts/admin',
      registrations,
      kuota,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show pendaftaran error:', error);
    req.session.error = 'Gagal memuat pendaftaran';
    res.redirect('/admin/dashboard');
  }
};

// @desc    View pendaftaran detail (admin)
// @route   GET /admin/pendaftaran/:id
const viewPendaftaranDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const pendaftaran = await PendaftaranP4.findById(id);
    if (!pendaftaran) {
      req.session.error = 'Pendaftaran tidak ditemukan';
      return res.redirect('/admin/pendaftaran');
    }

    res.render('admin/pendaftaran-detail', {
      title: 'Detail Pendaftaran - P4 Jakarta',
      layout: 'layouts/admin',
      pendaftaran,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('View pendaftaran detail error:', error);
    req.session.error = 'Gagal memuat detail pendaftaran';
    res.redirect('/admin/pendaftaran');
  }
};

// @desc    Delete pendaftaran (admin)
// @route   POST /admin/pendaftaran/:id/delete
const deletePendaftaran = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranP4.delete(id);
    req.session.success = 'Pendaftaran berhasil dihapus';
    res.redirect('/admin/pendaftaran');
  } catch (error) {
    logger.error('Delete pendaftaran error:', error);
    req.session.error = 'Gagal menghapus pendaftaran';
    res.redirect('/admin/pendaftaran');
  }
};

module.exports = {
  showManageAdminPage,
  addAdmin,
  updateAdmin,
  deleteAdmin,
  showPendaftaranPage,
  viewPendaftaranDetail,
  deletePendaftaran
};