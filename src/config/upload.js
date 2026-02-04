const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Ensure articles upload directory exists
const articlesUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'articles');
if (!fs.existsSync(articlesUploadDir)) fs.mkdirSync(articlesUploadDir, { recursive: true });

// Ensure surat tugas upload directory exists
const suratTugasUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'surat_tugas');
if (!fs.existsSync(suratTugasUploadDir)) fs.mkdirSync(suratTugasUploadDir, { recursive: true });

// Ensure surat keterangan upload directory exists
const suratKeteranganUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'surat_keterangan');
if (!fs.existsSync(suratKeteranganUploadDir)) fs.mkdirSync(suratKeteranganUploadDir, { recursive: true });

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

// Storage engine for surat tugas
const suratTugasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, suratTugasUploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').replace(ext, '');
    cb(null, `${timestamp}_${safeName}${ext}`);
  }
});

// Storage engine for surat keterangan
const suratKeteranganStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, suratKeteranganUploadDir);
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

// File filter for documents (PDF and images)
function documentFilter(req, file, cb) {
  const allowedExt = /pdf|jpeg|jpg|png/;
  const allowedMimetypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  const ext = allowedExt.test(file.originalname.split('.').pop().toLowerCase());
  const mimetype = allowedMimetypes.includes(file.mimetype);
  
  if (mimetype && ext) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF, JPG, JPEG, dan PNG yang diizinkan'));
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

const uploadSuratTugas = multer({
  storage: suratTugasStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFilter
});

const uploadSuratKeterangan = multer({
  storage: suratKeteranganStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFilter
});

module.exports = upload;
module.exports.uploadArticleImage = uploadArticleImage;
module.exports.uploadSuratTugas = uploadSuratTugas;
module.exports.uploadSuratKeterangan = uploadSuratKeterangan;