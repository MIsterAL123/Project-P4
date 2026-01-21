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

// Students
router.get('/students', guruController.showStudents);

const upload = require('../config/upload');

// Materials
router.get('/materials', guruController.showMaterials);
router.post('/materials/upload', upload.single('file'), guruController.uploadMaterial);
router.post('/materials/:id/delete', guruController.deleteMaterial);

module.exports = router;