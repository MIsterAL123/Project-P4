const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login routes
router.get('/login', authController.showLoginPage);
router.post('/login', authController.login);

// Register Guru routes
router.get('/register-guru', authController.showRegisterGuruPage);
router.post('/register-guru', authController.registerGuru);

// Register Peserta routes
router.get('/register-peserta', authController.showRegisterPesertaPage);
router.post('/register-peserta', authController.registerPeserta);

// Logout
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// Forgot Password
router.get('/forgot-password', authController.showForgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;