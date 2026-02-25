const express = require('express');
const router = express.Router();

// Import route modules
const publicRoutes = require('./publicRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const guruRoutes = require('./guruRoutes');
const pesertaRoutes = require('./pesertaRoutes');
const apiRoutes = require('./apiRoutes');
const fileRoutes = require('./fileRoutes');

// Public routes (Homepage, About, Contact, etc)
router.use('/', publicRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Protected file routes (surat tugas/surat keterangan)
router.use('/files', fileRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Guru routes
router.use('/guru', guruRoutes);

// Peserta routes
router.use('/peserta', pesertaRoutes);

// API routes
router.use('/api', apiRoutes);

module.exports = router;
