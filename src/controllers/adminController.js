// Manajemen admin
const Admin = require('../models/Admin');
const User = require('../models/User');
const logger = require('../utils/logger');
const PendaftaranP4 = require('../models/PendaftaranP4');
const PendaftaranGuruP4 = require('../models/PendaftaranGuruP4');
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
    const { nama, email, password, confirm_password, no_hp, is_active } = req.body;

    // Only Super Admin can add admins
    if (!isSuperAdmin(req)) {
      req.session.error = 'Akses ditolak: hanya Super Admin yang dapat menambah admin';
      return res.redirect('/admin/manage-admin');
    }

    // Validation
    const errors = [];

    if (!nama || nama.trim().length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }
    if (!password || password.length < 8) {
      errors.push('Password minimal 8 karakter');
    }
    if (password !== confirm_password) {
      errors.push('Konfirmasi password tidak cocok');
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
        user: req.user,
        isSuper: true,
        errors,
        formData: { nama, email, no_hp, is_active }
      });
    }

    // Get current admin id
    const currentAdmin = await Admin.findByUserId(req.user.id);

    // Create new admin
    await Admin.create({ 
      nama: nama.trim(), 
      email: email.trim(), 
      password, 
      no_hp: no_hp || null, 
      is_active: is_active === '1' ? 1 : 0
    }, currentAdmin ? currentAdmin.id : null);

    logger.info(`New admin added by ${req.user.email}: ${email}`);
    req.session.success = 'Admin baru berhasil ditambahkan';
    res.redirect('/admin/manage-admin');
  } catch (error) {
    logger.error('Add admin error:', error);
    req.session.error = 'Gagal menambahkan admin: ' + (error.message || 'Unknown error');
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

// @desc    Show pendaftaran pendidik page
// @route   GET /admin/pendaftaran-pendidik
const showPendaftaranPendidikPage = async (req, res) => {
  try {
    const { kuota_id, status } = req.query;
    
    // Get all kuota for filter dropdown (target guru or semua)
    const allKuota = await KuotaP4.findAll();
    const kuotaList = allKuota.filter(k => k.target_peserta === 'guru' || k.target_peserta === 'semua');
    
    // Get pendaftaran guru based on filters
    let pendaftaranList = await PendaftaranP4.findGuruPendaftaran(kuota_id, status);

    res.render('admin/pendaftaran-pendidik', {
      title: 'Pendaftaran Pendidik - P4 Jakarta',
      layout: 'layouts/admin',
      pendaftaranList,
      kuotaList,
      selectedKuota: kuota_id || '',
      selectedStatus: status || '',
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show pendaftaran pendidik error:', error);
    req.session.error = 'Gagal memuat data pendaftaran pendidik';
    res.redirect('/admin/dashboard');
  }
};

// @desc    Approve pendaftaran pendidik
// @route   POST /admin/pendaftaran-pendidik/:id/approve
const approvePendaftaranPendidik = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranGuruP4.updateStatus(id, 'approved');
    logger.info(`Pendaftaran pendidik approved by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran pendidik berhasil disetujui';
    res.redirect('/admin/pendaftaran-pendidik');
  } catch (error) {
    logger.error('Approve pendaftaran pendidik error:', error);
    req.session.error = 'Gagal menyetujui pendaftaran';
    res.redirect('/admin/pendaftaran-pendidik');
  }
};

// @desc    Reject pendaftaran pendidik
// @route   POST /admin/pendaftaran-pendidik/:id/reject
const rejectPendaftaranPendidik = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranGuruP4.updateStatus(id, 'rejected');
    logger.info(`Pendaftaran pendidik rejected by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran pendidik berhasil ditolak';
    res.redirect('/admin/pendaftaran-pendidik');
  } catch (error) {
    logger.error('Reject pendaftaran pendidik error:', error);
    req.session.error = 'Gagal menolak pendaftaran';
    res.redirect('/admin/pendaftaran-pendidik');
  }
};

// @desc    Show pendaftaran siswa page
// @route   GET /admin/pendaftaran-siswa
const showPendaftaranSiswaPage = async (req, res) => {
  try {
    const { kuota_id, status } = req.query;
    
    // Get all kuota for filter dropdown (target peserta or semua)
    const allKuota = await KuotaP4.findAll();
    const kuotaList = allKuota.filter(k => k.target_peserta === 'peserta' || k.target_peserta === 'semua');
    
    // Get pendaftaran peserta based on filters
    let pendaftaranList = await PendaftaranP4.findPesertaPendaftaran(kuota_id, status);

    res.render('admin/pendaftaran-siswa', {
      title: 'Pendaftaran Siswa - P4 Jakarta',
      layout: 'layouts/admin',
      pendaftaranList,
      kuotaList,
      selectedKuota: kuota_id || '',
      selectedStatus: status || '',
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show pendaftaran siswa error:', error);
    req.session.error = 'Gagal memuat data pendaftaran siswa';
    res.redirect('/admin/dashboard');
  }
};

// @desc    Approve pendaftaran siswa
// @route   POST /admin/pendaftaran-siswa/:id/approve
const approvePendaftaranSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranP4.updateStatus(id, 'approved');
    logger.info(`Pendaftaran siswa approved by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran siswa berhasil disetujui';
    res.redirect('/admin/pendaftaran-siswa');
  } catch (error) {
    logger.error('Approve pendaftaran siswa error:', error);
    req.session.error = 'Gagal menyetujui pendaftaran';
    res.redirect('/admin/pendaftaran-siswa');
  }
};

// @desc    Reject pendaftaran siswa
// @route   POST /admin/pendaftaran-siswa/:id/reject
const rejectPendaftaranSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranP4.updateStatus(id, 'rejected');
    logger.info(`Pendaftaran siswa rejected by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran siswa berhasil ditolak';
    res.redirect('/admin/pendaftaran-siswa');
  } catch (error) {
    logger.error('Reject pendaftaran siswa error:', error);
    req.session.error = 'Gagal menolak pendaftaran';
    res.redirect('/admin/pendaftaran-siswa');
  }
};

// @desc    Update status pendaftaran siswa
// @route   POST /admin/pendaftaran-siswa/:id/update-status
const updateStatusPendaftaranSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await PendaftaranP4.updateStatus(id, status);
    logger.info(`Pendaftaran siswa status updated by ${req.user.email}: ID ${id} to ${status}`);
    req.session.success = 'Status pendaftaran siswa berhasil diperbarui';
    res.redirect('/admin/pendaftaran-siswa');
  } catch (error) {
    logger.error('Update status pendaftaran siswa error:', error);
    req.session.error = 'Gagal memperbarui status pendaftaran';
    res.redirect('/admin/pendaftaran-siswa');
  }
};

// @desc    Delete pendaftaran siswa
// @route   POST /admin/pendaftaran-siswa/:id/delete
const deletePendaftaranSiswa = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranP4.delete(id);
    logger.info(`Pendaftaran siswa deleted by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran siswa berhasil dihapus';
    res.redirect('/admin/pendaftaran-siswa');
  } catch (error) {
    logger.error('Delete pendaftaran siswa error:', error);
    req.session.error = 'Gagal menghapus pendaftaran';
    res.redirect('/admin/pendaftaran-siswa');
  }
};

// @desc    Update status pendaftaran pendidik
// @route   POST /admin/pendaftaran-pendidik/:id/update-status
const updateStatusPendaftaranPendidik = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await PendaftaranGuruP4.updateStatus(id, status);
    logger.info(`Pendaftaran pendidik status updated by ${req.user.email}: ID ${id} to ${status}`);
    req.session.success = 'Status pendaftaran pendidik berhasil diperbarui';
    res.redirect('/admin/pendaftaran-pendidik');
  } catch (error) {
    logger.error('Update status pendaftaran pendidik error:', error);
    req.session.error = 'Gagal memperbarui status pendaftaran pendidik';
    res.redirect('/admin/pendaftaran-pendidik');
  }
};

// @desc    Delete pendaftaran pendidik
// @route   POST /admin/pendaftaran-pendidik/:id/delete
const deletePendaftaranPendidik = async (req, res) => {
  try {
    const { id } = req.params;
    await PendaftaranGuruP4.delete(id);
    logger.info(`Pendaftaran pendidik deleted by ${req.user.email}: ID ${id}`);
    req.session.success = 'Pendaftaran pendidik berhasil dihapus';
    res.redirect('/admin/pendaftaran-pendidik');
  } catch (error) {
    logger.error('Delete pendaftaran pendidik error:', error);
    req.session.error = 'Gagal menghapus pendaftaran pendidik';
    res.redirect('/admin/pendaftaran-pendidik');
  }
};

module.exports = {
  showManageAdminPage,
  addAdmin,
  updateAdmin,
  deleteAdmin,
  showPendaftaranPage,
  viewPendaftaranDetail,
  deletePendaftaran,
  showPendaftaranPendidikPage,
  approvePendaftaranPendidik,
  rejectPendaftaranPendidik,
  updateStatusPendaftaranPendidik,
  deletePendaftaranPendidik,
  showPendaftaranSiswaPage,
  approvePendaftaranSiswa,
  rejectPendaftaranSiswa,
  updateStatusPendaftaranSiswa,
  deletePendaftaranSiswa
};