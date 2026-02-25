const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const fileController = require('../controllers/fileController');

router.use(protect);

router.get('/surat-tugas/:pendaftaranId{/:documentName}', fileController.viewSuratTugasByPendaftaranId);
router.get('/surat-keterangan/:pendaftaranId{/:documentName}', fileController.viewSuratKeteranganByPendaftaranId);

module.exports = router;
