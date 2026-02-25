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

function sanitizeFilenamePart(value) {
  return String(value || '')
    .replace(/[\/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDocumentFilename(storedName, title) {
  const safeBaseName = path.basename(storedName || '');
  const withoutPrefix = safeBaseName.replace(/^\d+_/, '');
  const ext = path.extname(withoutPrefix || safeBaseName);
  const fallbackStem = path.basename(withoutPrefix || safeBaseName, ext).replace(/_/g, ' ').trim();
  const titleStem = sanitizeFilenamePart(title);
  return `${titleStem || fallbackStem || 'surat'}${ext || '.pdf'}`;
}

function buildCanonicalSlug(documentFilename) {
  const slug = String(documentFilename || 'surat.pdf')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'surat.pdf';
}

function ensureCanonicalFileUrl(req, res, pendaftaranId, routeKey, documentFilename) {
  const requestedName = req.params.documentName || '';
  const canonicalName = buildCanonicalSlug(documentFilename);

  if (requestedName === canonicalName) {
    return null;
  }

  const queryString = req.originalUrl.includes('?')
    ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
    : '';

  const redirectUrl = `${req.baseUrl}/${routeKey}/${pendaftaranId}/${encodeURIComponent(canonicalName)}${queryString}`;
  return res.redirect(302, redirectUrl);
}

function sendStoredFile(req, res, relativeDir, storedName, documentFilename) {
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
    return res.download(absolutePath, documentFilename, (err) => {
      if (!err) return;
      logger.error('Download file error:', err);
      if (res.headersSent) return;
      if (err.code === 'ENOENT') return sendNotFound(res);
      return res.status(500).render('errors/500');
    });
  }

  const fallbackAscii = documentFilename.replace(/[^\x20-\x7E]/g, '').replace(/"/g, '');
  const encodedName = encodeURIComponent(documentFilename);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fallbackAscii || 'surat.pdf'}"; filename*=UTF-8''${encodedName}`
  );
  return res.sendFile(absolutePath, (err) => {
    if (!err) return;
    logger.error('Send file error:', err);
    if (res.headersSent) return;
    if (err.code === 'ENOENT') return sendNotFound(res);
    return res.status(500).render('errors/500');
  });
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

    const documentFilename = buildDocumentFilename(
      pendaftaran.surat_tugas,
      pendaftaran.judul_pelatihan || 'Surat Tugas'
    );
    const canonicalRedirect = ensureCanonicalFileUrl(
      req,
      res,
      pendaftaran.id,
      'surat-tugas',
      documentFilename
    );

    if (canonicalRedirect) {
      return canonicalRedirect;
    }

    return sendStoredFile(req, res, 'surat_tugas', pendaftaran.surat_tugas, documentFilename);
  } catch (error) {
    logger.error('View surat tugas error:', error);
    if (res.headersSent) return;
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

    const documentFilename = buildDocumentFilename(
      pendaftaran.surat_keterangan,
      pendaftaran.judul_pelatihan || 'Surat Keterangan'
    );
    const canonicalRedirect = ensureCanonicalFileUrl(
      req,
      res,
      pendaftaran.id,
      'surat-keterangan',
      documentFilename
    );

    if (canonicalRedirect) {
      return canonicalRedirect;
    }

    return sendStoredFile(
      req,
      res,
      'surat_keterangan',
      pendaftaran.surat_keterangan,
      documentFilename
    );
  } catch (error) {
    logger.error('View surat keterangan error:', error);
    if (res.headersSent) return;
    return res.status(500).render('errors/500');
  }
};

module.exports = {
  viewSuratTugasByPendaftaranId,
  viewSuratKeteranganByPendaftaranId
};
