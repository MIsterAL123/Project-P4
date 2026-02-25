const fs = require('fs');
const path = require('path');
const PendaftaranP4 = require('../models/PendaftaranP4');
const PendaftaranGuruP4 = require('../models/PendaftaranGuruP4');
const logger = require('../utils/logger');

function isAdmin(user) {
  return user && user.role === 'admin';
}

function canAccessGuruRegistration(user, pendaftaran) {
  if (isAdmin(user)) return true;
  if (!user || user.role !== 'guru') return false;
  return Number(user.guru_id) === Number(pendaftaran.guru_id);
}

function canAccessPesertaRegistration(user, pendaftaran) {
  if (isAdmin(user)) return true;
  if (!user || user.role !== 'peserta') return false;
  return Number(user.peserta_id) === Number(pendaftaran.peserta_id);
}

function sendForbidden(res) {
  return res.status(403).render('errors/403');
}

function sendNotFound(res) {
  return res.status(404).render('errors/404');
}

function buildDownloadFilename(storedName) {
  const safeBaseName = path.basename(storedName || '');
  const withoutPrefix = safeBaseName.replace(/^\d+_/, '');
  const ext = path.extname(withoutPrefix || safeBaseName);
  const stem = path.basename(withoutPrefix || safeBaseName, ext).replace(/_/g, ' ').trim();
  return `${stem || 'surat'}${ext}`;
}

function sendStoredFile(req, res, relativeDir, storedName) {
  if (!storedName) {
    return sendNotFound(res);
  }

  const safeFilename = path.basename(storedName);
  const absolutePath = path.join(__dirname, '..', '..', 'public', 'uploads', relativeDir, safeFilename);

  if (!fs.existsSync(absolutePath)) {
    return sendNotFound(res);
  }

  const wantsDownload = String(req.query.download || '').toLowerCase();
  if (wantsDownload === '1' || wantsDownload === 'true') {
    const downloadName = buildDownloadFilename(safeFilename);
    return res.download(absolutePath, downloadName);
  }

  return res.sendFile(absolutePath);
}

// @desc    View surat tugas by pendaftaran id with role/ownership check
// @route   GET /files/surat-tugas/:pendaftaranId
const viewSuratTugasByPendaftaranId = async (req, res) => {
  try {
    const { pendaftaranId } = req.params;
    const pendaftaran = await PendaftaranGuruP4.findById(pendaftaranId);

    if (!pendaftaran) {
      return sendNotFound(res);
    }

    if (!canAccessGuruRegistration(req.user, pendaftaran)) {
      return sendForbidden(res);
    }

    return sendStoredFile(req, res, 'surat_tugas', pendaftaran.surat_tugas);
  } catch (error) {
    logger.error('View surat tugas error:', error);
    return res.status(500).render('errors/500');
  }
};

// @desc    View surat keterangan by pendaftaran id with role/ownership check
// @route   GET /files/surat-keterangan/:pendaftaranId
const viewSuratKeteranganByPendaftaranId = async (req, res) => {
  try {
    const { pendaftaranId } = req.params;
    const pendaftaran = await PendaftaranP4.findById(pendaftaranId);

    if (!pendaftaran) {
      return sendNotFound(res);
    }

    if (!canAccessPesertaRegistration(req.user, pendaftaran)) {
      return sendForbidden(res);
    }

    return sendStoredFile(req, res, 'surat_keterangan', pendaftaran.surat_keterangan);
  } catch (error) {
    logger.error('View surat keterangan error:', error);
    return res.status(500).render('errors/500');
  }
};

module.exports = {
  viewSuratTugasByPendaftaranId,
  viewSuratKeteranganByPendaftaranId
};
