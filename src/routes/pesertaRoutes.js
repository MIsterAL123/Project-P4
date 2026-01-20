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

// Pendaftaran P4
router.get('/daftar-p4', pendaftaranController.showDaftarP4Page);
router.post('/daftar-p4', pendaftaranController.daftarP4);

// Status Pendaftaran
router.get('/status-pendaftaran', pendaftaranController.showStatusPendaftaran);
router.post('/pendaftaran/:id/cancel', pendaftaranController.cancelPendaftaran);

// My Courses
router.get('/my-courses', pendaftaranController.showMyCourses);

module.exports = router;