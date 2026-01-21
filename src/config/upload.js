const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Storage engine
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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

module.exports = upload;