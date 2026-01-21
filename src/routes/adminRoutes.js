const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const guruController = require('../controllers/guruController');
const pesertaController = require('../controllers/pesertaController');
const kuotaController = require('../controllers/kuotaController');

// All admin routes are protected
router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', dashboardController.showAdminDashboard);

// Manage Admin
router.get('/manage-admin', adminController.showManageAdminPage);
router.post('/add-admin', adminController.addAdmin);
router.post('/update-admin/:id', adminController.updateAdmin);
router.post('/delete-admin/:id', adminController.deleteAdmin);

// Approve Guru
router.get('/approve-guru', guruController.showApproveGuruPage);
router.post('/guru/:id/approve', guruController.approveGuru);
router.post('/guru/:id/reject', guruController.rejectGuru);

// Manage Peserta
router.get('/manage-peserta', pesertaController.showManagePesertaPage);
router.get('/peserta/:id', pesertaController.viewPesertaDetail);

// Manage Kuota
router.get('/manage-kuota', kuotaController.showManageKuotaPage);
router.post('/kuota/create', kuotaController.createKuota);
router.post('/kuota/update', kuotaController.updateKuota);
router.post('/kuota/:id/toggle-status', kuotaController.toggleKuotaStatus);
router.post('/kuota/:id/delete', kuotaController.deleteKuota);

// Pendaftaran
router.get('/pendaftaran', adminController.showPendaftaranPage);
router.get('/pendaftaran/:id', adminController.viewPendaftaranDetail);
router.post('/pendaftaran/:id/delete', adminController.deletePendaftaran);

// Reports
router.get('/reports', dashboardController.showReportsPage);

module.exports = router;