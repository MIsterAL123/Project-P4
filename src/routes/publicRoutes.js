const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const KuotaP4 = require('../models/KuotaP4');
const Article = require('../models/Article');

// Apply optional auth to all public routes
router.use(optionalAuth);

// Homepage
router.get('/', async (req, res) => {
  try {
    const articles = await Article.findPublished(5);
    const kuotaList = await KuotaP4.findAllActive();
    res.render('public/home', {
      title: 'P4 Jakarta - Pusat Pelatihan dan Pengembangan Pendidikan',
      layout: 'layouts/main',
      articles,
      kuotaList
    });
  } catch (error) {
    res.render('public/home', {
      title: 'P4 Jakarta - Pusat Pelatihan dan Pengembangan Pendidikan',
      layout: 'layouts/main',
      articles: [],
      kuotaList: []
    });
  }
});

// Article detail
router.get('/artikel/:slug', async (req, res) => {
  try {
    const article = await Article.findBySlug(req.params.slug);
    if (!article) {
      return res.status(404).render('errors/404', {
        title: 'Artikel Tidak Ditemukan',
        message: 'Artikel yang Anda cari tidak ditemukan',
        layout: 'layouts/main'
      });
    }
    res.render('public/article', {
      title: article.title + ' - P4 Jakarta',
      layout: 'layouts/main',
      article
    });
  } catch (error) {
    res.status(500).render('errors/500', {
      title: 'Terjadi Kesalahan',
      layout: 'layouts/main'
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

// Pelatihan page (replacing programs)
router.get('/pelatihan', async (req, res) => {
  try {
    const kuotaList = await KuotaP4.findAllActive();
    res.render('public/pelatihan', {
      title: 'Daftar Pelatihan - P4 Jakarta',
      layout: 'layouts/main',
      kuotaList
    });
  } catch (error) {
    res.render('public/pelatihan', {
      title: 'Daftar Pelatihan - P4 Jakarta',
      layout: 'layouts/main',
      kuotaList: []
    });
  }
});

// Programs redirect to pelatihan
router.get('/programs', (req, res) => {
  res.redirect('/pelatihan');
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

// Contact page (without message form)
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    title: 'Kontak - P4 Jakarta',
    layout: 'layouts/main'
  });
});

module.exports = router;