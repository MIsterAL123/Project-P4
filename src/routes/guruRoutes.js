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

// Materials (placeholder for future)
router.get('/materials', (req, res) => {
  res.render('guru/materials', {
    title: 'Materi Pelatihan - P4 Jakarta',
    layout: 'layouts/admin',
    currentUser: req.user
  });
});

module.exports = router;