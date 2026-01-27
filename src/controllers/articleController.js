// Controller untuk artikel
const Article = require('../models/Article');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

// @desc    Show manage articles page
// @route   GET /admin/articles
const showArticlesPage = async (req, res) => {
  try {
    const articles = await Article.findAll();

    res.render('admin/manage-articles', {
      title: 'Kelola Artikel - P4 Jakarta',
      layout: 'layouts/admin',
      articles,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show articles page error:', error);
    req.session.error = 'Gagal memuat artikel';
    res.redirect('/admin/dashboard');
  }
};

// @desc    Show create article form
// @route   GET /admin/articles/create
const showCreateArticle = async (req, res) => {
  res.render('admin/article-form', {
    title: 'Tulis Artikel Baru - P4 Jakarta',
    layout: 'layouts/admin',
    article: null,
    isEdit: false,
    currentUser: req.user,
    user: req.user
  });
};

// @desc    Create new article
// @route   POST /admin/articles/create
const createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, status } = req.body;
    
    // Validation
    const errors = [];
    if (!title || title.trim().length < 5) {
      errors.push('Judul minimal 5 karakter');
    }
    if (!content || content.trim().length < 50) {
      errors.push('Konten minimal 50 karakter');
    }

    if (errors.length > 0) {
      return res.render('admin/article-form', {
        title: 'Tulis Artikel Baru - P4 Jakarta',
        layout: 'layouts/admin',
        article: { title, content, excerpt, status },
        isEdit: false,
        currentUser: req.user,
        user: req.user,
        errors
      });
    }

    // Generate slug
    let slug = Article.generateSlug(title);
    
    // Check if slug exists, add suffix if needed
    let slugExists = await Article.slugExists(slug);
    let counter = 1;
    while (slugExists) {
      slug = Article.generateSlug(title) + '-' + counter;
      slugExists = await Article.slugExists(slug);
      counter++;
    }

    // Get admin id
    const admin = await Admin.findByUserId(req.user.id);

    // Create article
    await Article.create({
      title: title.trim(),
      slug,
      content: content.trim(),
      excerpt: excerpt ? excerpt.trim() : null,
      author_id: admin.id,
      status: status || 'draft'
    });

    logger.info(`Article created by ${req.user.email}: ${title}`);
    req.session.success = 'Artikel berhasil dibuat';
    res.redirect('/admin/articles');
  } catch (error) {
    logger.error('Create article error:', error);
    req.session.error = 'Gagal membuat artikel';
    res.redirect('/admin/articles/create');
  }
};

// @desc    Show edit article form
// @route   GET /admin/articles/:id/edit
const showEditArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) {
      req.session.error = 'Artikel tidak ditemukan';
      return res.redirect('/admin/articles');
    }

    res.render('admin/article-form', {
      title: 'Edit Artikel - P4 Jakarta',
      layout: 'layouts/admin',
      article,
      isEdit: true,
      currentUser: req.user,
      user: req.user
    });
  } catch (error) {
    logger.error('Show edit article error:', error);
    req.session.error = 'Gagal memuat artikel';
    res.redirect('/admin/articles');
  }
};

// @desc    Update article
// @route   POST /admin/articles/:id/update
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, status } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      req.session.error = 'Artikel tidak ditemukan';
      return res.redirect('/admin/articles');
    }

    // Validation
    const errors = [];
    if (!title || title.trim().length < 5) {
      errors.push('Judul minimal 5 karakter');
    }
    if (!content || content.trim().length < 50) {
      errors.push('Konten minimal 50 karakter');
    }

    if (errors.length > 0) {
      return res.render('admin/article-form', {
        title: 'Edit Artikel - P4 Jakarta',
        layout: 'layouts/admin',
        article: { ...article, title, content, excerpt, status },
        isEdit: true,
        currentUser: req.user,
        user: req.user,
        errors
      });
    }

    // Generate slug if title changed
    let slug = article.slug;
    if (title.trim() !== article.title) {
      slug = Article.generateSlug(title);
      let slugExists = await Article.slugExists(slug, id);
      let counter = 1;
      while (slugExists) {
        slug = Article.generateSlug(title) + '-' + counter;
        slugExists = await Article.slugExists(slug, id);
        counter++;
      }
    }

    // Update article
    await Article.update(id, {
      title: title.trim(),
      slug,
      content: content.trim(),
      excerpt: excerpt ? excerpt.trim() : null,
      status: status || 'draft'
    });

    logger.info(`Article updated by ${req.user.email}: ${title}`);
    req.session.success = 'Artikel berhasil diperbarui';
    res.redirect('/admin/articles');
  } catch (error) {
    logger.error('Update article error:', error);
    req.session.error = 'Gagal memperbarui artikel';
    res.redirect('/admin/articles');
  }
};

// @desc    Delete article
// @route   POST /admin/articles/:id/delete
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);

    if (!article) {
      req.session.error = 'Artikel tidak ditemukan';
      return res.redirect('/admin/articles');
    }

    await Article.delete(id);

    logger.info(`Article deleted by ${req.user.email}: ${article.title}`);
    req.session.success = 'Artikel berhasil dihapus';
    res.redirect('/admin/articles');
  } catch (error) {
    logger.error('Delete article error:', error);
    req.session.error = 'Gagal menghapus artikel';
    res.redirect('/admin/articles');
  }
};

module.exports = {
  showArticlesPage,
  showCreateArticle,
  createArticle,
  showEditArticle,
  updateArticle,
  deleteArticle
};
