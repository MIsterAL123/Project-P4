const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Ensure articles upload directory exists
const articlesUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'articles');
if (!fs.existsSync(articlesUploadDir)) fs.mkdirSync(articlesUploadDir, { recursive: true });

// Storage engine for materials
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

// Storage engine for article images
const articleImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, articlesUploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(ext, '');
    cb(null, `${timestamp}_${safeName}${ext}`);
  }
});

// File filter: allow pdf, doc, docx, ppt, pptx, mp4, mp3
function fileFilter(req, file, cb) {
  const allowed = /pdf|doc|docx|ppt|pptx|mp4|mp3/;
  const mimetype = allowed.test(file.mimetype);
  const ext = allowed.test(file.originalname.split('.').pop().toLowerCase());
  if (mimetype && ext) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak diizinkan'));
  }
}

// File filter for images
function imageFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const mimetype = file.mimetype.startsWith('image/');
  const ext = allowed.test(file.originalname.split('.').pop().toLowerCase());
  if (mimetype && ext) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan (JPEG, PNG, GIF, WebP)'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

const uploadArticleImage = multer({
  storage: articleImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter
});

module.exports = upload;
module.exports.uploadArticleImage = uploadArticleImage;