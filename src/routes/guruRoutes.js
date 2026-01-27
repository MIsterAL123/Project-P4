const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { isGuru } = require('../middlewares/roleMiddleware');
const guruController = require('../controllers/guruController');

// All guru routes are protected
router.use(protect);
router.use(isGuru);

// Dashboard
router.get('/dashboard', guruController.showDashboard);

// Profile
router.get('/profile', guruController.showProfile);
router.post('/profile/update', guruController.updateProfile);
router.post('/change-password', guruController.changePassword);

// Upload config for surat tugas
const upload = require('../config/upload');

// Daftar Pelatihan P4
router.get('/daftar-pelatihan', guruController.showDaftarPelatihan);
router.post('/daftar-pelatihan', upload.single('surat_tugas'), guruController.daftarPelatihan);

// Status Pendaftaran
router.get('/status-pendaftaran', guruController.showStatusPendaftaran);
router.post('/pendaftaran/:id/cancel', guruController.cancelPendaftaran);

// Riwayat Pelatihan
router.get('/riwayat-pelatihan', guruController.showRiwayatPelatihan);

module.exports = router;