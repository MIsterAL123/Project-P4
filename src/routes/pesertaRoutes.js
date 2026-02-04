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

// Upload config for surat keterangan
const { uploadSuratKeterangan } = require('../config/upload');

// Helper to catch Multer errors and set flash
function handleMulterUpload(fieldName, uploader) {
  return (req, res, next) => {
    uploader.single(fieldName)(req, res, function(err) {
      if (err) {
        // Log detailed error and redirect back to form
        const logger = require('../utils/logger');
        logger.error('Multer upload error (peserta):', err);
        req.session.error = err.message || 'Proses upload gagal';
        // Redirect back to the daftar pelatihan page for the given kuota
        const referer = req.headers.referer || `/peserta/daftar-pelatihan/${req.params.kuotaId}`;
        return res.redirect(referer);
      }
      next();
    });
  };
}

// Pelatihan List
router.get('/pelatihan', pendaftaranController.showPelatihanList);

// Daftar Pelatihan P4
router.get('/daftar-pelatihan/:kuotaId', pendaftaranController.showDaftarPelatihanPage);
router.post('/daftar-pelatihan/:kuotaId', pendaftaranController.daftarPelatihan);

// Upload Surat Keterangan (after approval)
router.get('/upload-surat-keterangan/:pendaftaranId', pendaftaranController.showUploadSuratKeterangan);
router.post('/upload-surat-keterangan/:pendaftaranId', handleMulterUpload('surat_keterangan', uploadSuratKeterangan), pendaftaranController.uploadSuratKeterangan);

// Status Pendaftaran
router.get('/status-pendaftaran', pendaftaranController.showStatusPendaftaran);
router.post('/pendaftaran/:id/cancel', pendaftaranController.cancelPendaftaran);

// Riwayat Pelatihan
router.get('/riwayat-pelatihan', pendaftaranController.showRiwayatPelatihan);

module.exports = router;