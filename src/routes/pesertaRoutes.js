const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { isPeserta } = require('../middlewares/roleMiddleware');
const pesertaController = require('../controllers/pesertaController');
const pendaftaranController = require('../controllers/pendaftaranController');

// All peserta routes are protected
router.use(protect);
router.use(isPeserta);

// Dashboard
router.get('/dashboard', pesertaController.showDashboard);

// Profile
router.get('/profile', pesertaController.showProfile);
router.post('/profile/update', pesertaController.updateProfile);
router.post('/change-password', pesertaController.changePassword);

// Pelatihan List
router.get('/pelatihan', pendaftaranController.showPelatihanList);

// Daftar Pelatihan P4
router.get('/daftar-pelatihan/:kuotaId', pendaftaranController.showDaftarPelatihanPage);
router.post('/daftar-pelatihan/:kuotaId', pendaftaranController.daftarPelatihan);

// Status Pendaftaran
router.get('/status-pendaftaran', pendaftaranController.showStatusPendaftaran);
router.post('/pendaftaran/:id/cancel', pendaftaranController.cancelPendaftaran);

// Riwayat Pelatihan
router.get('/riwayat-pelatihan', pendaftaranController.showRiwayatPelatihan);

module.exports = router;