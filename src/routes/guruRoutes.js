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
const { uploadSuratTugas } = require('../config/upload');

// Helper to catch Multer errors and set flash
function handleMulterUpload(fieldName, uploader) {
  return (req, res, next) => {
    uploader.single(fieldName)(req, res, function(err) {
      if (err) {
        req.session.error = err.message || 'Proses upload gagal';
        return res.redirect('back');
      }
      next();
    });
  };
}

// Daftar Pelatihan P4 - New Flow (urutan penting!)
router.get('/daftar-pelatihan', guruController.showDaftarPelatihan); // List pelatihan
router.get('/daftar-pelatihan/:kuotaId', guruController.showKonfirmasiPendaftaran); // Konfirmasi page
router.post('/konfirmasi-pendaftaran/:kuotaId', handleMulterUpload('surat_tugas', uploadSuratTugas), guruController.prosesPendaftaran); // Process registration with file

// Upload Surat Tugas (Optional - for later upload)
router.get('/upload-surat-tugas/:pendaftaranId', guruController.showUploadSuratTugas); // Upload page
router.post('/upload-surat-tugas/:pendaftaranId', handleMulterUpload('surat_tugas', uploadSuratTugas), guruController.uploadSuratTugas); // Process upload

// Status Pendaftaran
router.get('/status-pendaftaran', guruController.showStatusPendaftaran);
router.post('/pendaftaran/:id/cancel', guruController.cancelPendaftaran);

// Riwayat Pelatihan
router.get('/riwayat-pelatihan', guruController.showRiwayatPelatihan);

module.exports = router;