const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const KuotaP4 = require('../models/KuotaP4');

// Apply optional auth to all public routes
router.use(optionalAuth);

// Homepage
router.get('/', async (req, res) => {
  try {
    const kuota = await KuotaP4.findActiveKuota();
    res.render('public/home', {
      title: 'P4 Jakarta - Pusat Pelatihan dan Pengembangan Pendidikan',
      layout: 'layouts/main',
      kuota
    });
  } catch (error) {
    res.render('public/home', {
      title: 'P4 Jakarta - Pusat Pelatihan dan Pengembangan Pendidikan',
      layout: 'layouts/main',
      kuota: null
    });
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('public/about', {
    title: 'Tentang Kami - P4 Jakarta',
    layout: 'layouts/main',
    sejarahImageUrl: process.env.ABOUT_SEJARAH_IMAGE_URL || null
  });
});

// Programs page
router.get('/programs', (req, res) => {
  res.render('public/programs', {
    title: 'Program Pelatihan - P4 Jakarta',
    layout: 'layouts/main'
  });
});

// Facilities page
router.get('/facilities', (req, res) => {
  res.render('public/facilities', {
    title: 'Fasilitas - P4 Jakarta',
    layout: 'layouts/main'
  });
});

// Gallery page
router.get('/gallery', (req, res) => {
  res.render('public/gallery', {
    title: 'Galeri - P4 Jakarta',
    layout: 'layouts/main'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Kontak - P4 Jakarta',
    layout: 'layouts/main'
  });
});

module.exports = router;