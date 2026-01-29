const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const { uploadArticleImage } = require('../config/upload');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const guruController = require('../controllers/guruController');
const pesertaController = require('../controllers/pesertaController');
const kuotaController = require('../controllers/kuotaController');
const articleController = require('../controllers/articleController');

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

// Approve Guru (Tenaga Kependidikan)
router.get('/approve-guru', guruController.showApproveGuruPage);
router.post('/guru/:id/approve', guruController.approveGuru);
router.post('/guru/:id/reject', guruController.rejectGuru);

// Manage Peserta
router.get('/manage-peserta', pesertaController.showManagePesertaPage);
router.get('/peserta/:id', pesertaController.viewPesertaDetail);
router.post('/manage-peserta/:id/delete', pesertaController.deletePeserta);

// Manage Kuota Pelatihan
router.get('/manage-kuota', kuotaController.showManageKuotaPage);
router.post('/kuota/create', kuotaController.createKuota);
router.post('/kuota/update', kuotaController.updateKuota);
router.post('/kuota/:id/toggle-status', kuotaController.toggleKuotaStatus);
router.post('/kuota/:id/delete', kuotaController.deleteKuota);

// Pendaftaran
router.get('/pendaftaran', adminController.showPendaftaranPage);
router.get('/pendaftaran/:id', adminController.viewPendaftaranDetail);
router.post('/pendaftaran/:id/delete', adminController.deletePendaftaran);

// Articles (Artikel)
router.get('/articles', articleController.showArticlesPage);
router.get('/articles/create', articleController.showCreateArticle);
router.post('/articles/create', (req, res, next) => {
  uploadArticleImage.single('image')(req, res, (err) => {
    if (err) {
      req.session.error = err.message || 'Gagal mengupload gambar';
      return res.redirect('/admin/articles/create');
    }
    next();
  });
}, articleController.createArticle);
router.get('/articles/:id/edit', articleController.showEditArticle);
router.post('/articles/:id/update', (req, res, next) => {
  uploadArticleImage.single('image')(req, res, (err) => {
    if (err) {
      req.session.error = err.message || 'Gagal mengupload gambar';
      return res.redirect('/admin/articles/' + req.params.id + '/edit');
    }
    next();
  });
}, articleController.updateArticle);
router.post('/articles/:id/delete', articleController.deleteArticle);

// Reports
router.get('/reports', dashboardController.showReportsPage);

module.exports = router;