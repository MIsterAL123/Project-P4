// Login, register, logout
const User = require('../models/User');
const Admin = require('../models/Admin');
const Guru = require('../models/Guru');
const Peserta = require('../models/Peserta');
const { generateToken, getCookieOptions } = require('../config/auth');
const logger = require('../utils/logger');

// @desc    Show login page
// @route   GET /auth/login
const showLoginPage = (req, res) => {
  res.render('auth/login', {
    title: 'Login - P4 Jakarta',
    layout: 'layouts/auth'
  });
};

// @desc    Login user
// @route   POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login - P4 Jakarta',
        layout: 'layouts/auth',
        error: 'Email dan password wajib diisi',
        email
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('auth/login', {
        title: 'Login - P4 Jakarta',
        layout: 'layouts/auth',
        error: 'Email atau password salah',
        email
      });
    }

    // Check password
    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login - P4 Jakarta',
        layout: 'layouts/auth',
        error: 'Email atau password salah',
        email
      });
    }

    // Check guru status if role is guru
    if (user.role === 'guru') {
      const guru = await Guru.findByUserId(user.id);
      if (guru && guru.status === 'pending') {
        return res.render('auth/guru-pending', {
          title: 'Menunggu Approval - P4 Jakarta',
          layout: 'layouts/auth',
          message: 'Akun Anda masih menunggu persetujuan admin.'
        });
      }
      if (guru && guru.status === 'reject') {
        return res.render('auth/guru-rejected', {
          title: 'Akun Ditolak - P4 Jakarta',
          layout: 'layouts/auth',
          reason: guru.rejection_reason || 'Tidak ada alasan yang diberikan.'
        });
      }
    }

    // Generate token
    const token = generateToken(user);

    // Set session
    req.session.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role
    };

    // Set cookie
    res.cookie('token', token, getCookieOptions());

    logger.info(`User logged in: ${user.email}`);

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        return res.redirect('/admin/dashboard');
      case 'guru':
        return res.redirect('/guru/dashboard');
      case 'peserta':
        return res.redirect('/peserta/dashboard');
      default:
        return res.redirect('/');
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - P4 Jakarta',
      layout: 'layouts/auth',
      error: 'Terjadi kesalahan. Silakan coba lagi.'
    });
  }
};

// @desc    Show guru registration page
// @route   GET /auth/register-guru
const showRegisterGuruPage = (req, res) => {
  res.render('auth/register-guru', {
    title: 'Daftar Guru - P4 Jakarta',
    layout: 'layouts/auth'
  });
};

// @desc    Register guru
// @route   POST /auth/register-guru
const registerGuru = async (req, res) => {
  try {
    const { nama, email, nip, link_dokumen, password, confirm_password } = req.body;

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

    // Check if NIP exists
    if (await Guru.nipExists(nip)) {
      errors.push('NIP sudah terdaftar');
    }

    if (errors.length > 0) {
      return res.render('auth/register-guru', {
        title: 'Daftar Guru - P4 Jakarta',
        layout: 'layouts/auth',
        errors,
        data: { nama, email, nip, link_dokumen }
      });
    }

    // Create guru
    const guru = await Guru.create({
      nama,
      email,
      password,
      nip,
      link_dokumen
    });

    logger.info(`New guru registered: ${email} (pending approval)`);

    // Redirect to pending page
    res.render('auth/guru-pending', {
      title: 'Pendaftaran Berhasil - P4 Jakarta',
      layout: 'layouts/auth',
      message: 'Pendaftaran berhasil! Akun Anda akan diverifikasi oleh admin.',
      isNewRegistration: true
    });
  } catch (error) {
    logger.error('Register guru error:', error);
    res.render('auth/register-guru', {
      title: 'Daftar Guru - P4 Jakarta',
      layout: 'layouts/auth',
      errors: ['Terjadi kesalahan. Silakan coba lagi.'],
      data: req.body
    });
  }
};

// @desc    Show peserta registration page
// @route   GET /auth/register-peserta
const showRegisterPesertaPage = (req, res) => {
  res.render('auth/register-peserta', {
    title: 'Daftar Peserta - P4 Jakarta',
    layout: 'layouts/auth'
  });
};

// @desc    Register peserta
// @route   POST /auth/register-peserta
const registerPeserta = async (req, res) => {
  try {
    // Accept either 'nik' or 'nisn' from the form (legacy form used nisn)
    const { nama, email, nik: bodyNik, nisn, link_dokumen, password, confirm_password } = req.body;
    const nik = (bodyNik || nisn || '').trim();

    // Validation
    const errors = [];

    if (!nama || nama.trim().length < 3) {
      errors.push('Nama minimal 3 karakter');
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Email tidak valid');
    }
    // Allow NIK/NISN between 10 and 20 characters (accepts NISN as fallback)
    if (!nik || nik.length < 10 || nik.length > 20) {
      errors.push('NIK/NISN tidak valid (10-20 karakter)');
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

    // Check if NIK exists
    if (await Peserta.nikExists(nik)) {
      errors.push('NIK/NISN sudah terdaftar');
    }

    if (errors.length > 0) {
      return res.render('auth/register-peserta', {
        title: 'Daftar Peserta - P4 Jakarta',
        layout: 'layouts/auth',
        errors,
        data: { nama, email, nisn: nik }
      });
    }

    // Create peserta
    const peserta = await Peserta.create({
      nama,
      email,
      password,
      nik,
      link_dokumen
    });

    logger.info(`New peserta registered: ${email}`);

    // Auto login
    const user = await User.findByEmail(email);
    const token = generateToken(user);

    req.session.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role
    };

    res.cookie('token', token, getCookieOptions());

    req.session.success = 'Pendaftaran berhasil! Selamat datang di P4 Jakarta.';
    res.redirect('/peserta/dashboard');
  } catch (error) {
    logger.error('Register peserta error:', error);
    res.render('auth/register-peserta', {
      title: 'Daftar Peserta - P4 Jakarta',
      layout: 'layouts/auth',
      errors: ['Terjadi kesalahan. Silakan coba lagi.'],
      data: req.body
    });
  }
};

// @desc    Logout user
// @route   POST /auth/logout
const logout = (req, res) => {
  // Clear cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
};

// @desc    Show forgot password page
// @route   GET /auth/forgot-password
const showForgotPasswordPage = (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Lupa Password - P4 Jakarta',
    layout: 'layouts/auth'
  });
};

// @desc    Handle forgot password (Fase 2 - Email notification)
// @route   POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  // TODO: Implement email notification in Fase 2
  res.render('auth/forgot-password', {
    title: 'Lupa Password - P4 Jakarta',
    layout: 'layouts/auth',
    info: 'Fitur reset password akan segera tersedia. Silakan hubungi admin untuk bantuan.'
  });
};

module.exports = {
  showLoginPage,
  login,
  showRegisterGuruPage,
  registerGuru,
  showRegisterPesertaPage,
  registerPeserta,
  logout,
  showForgotPasswordPage,
  forgotPassword
};