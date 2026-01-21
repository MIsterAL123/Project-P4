// ==============================================
// VALIDATION MIDDLEWARE
// Website P4 Jakarta
// ==============================================

const { body, validationResult } = require('express-validator');

// Generic error handler for validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        
        // For API requests, return JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({ 
                success: false, 
                errors: errorMessages 
            });
        }
        
        // For web requests, redirect back with flash message
        req.flash('error', errorMessages.join(', '));
        return res.redirect('back');
    }
    next();
};

// ==============================================
// LOGIN VALIDATION
// ==============================================
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    handleValidationErrors
];

// ==============================================
// REGISTER PESERTA VALIDATION
// ==============================================
const validateRegisterPeserta = [
    body('nama')
        .trim()
        .notEmpty().withMessage('Nama lengkap wajib diisi')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Nama hanya boleh berisi huruf'),
    body('nik')
        .trim()
        .notEmpty().withMessage('NIK wajib diisi')
        .isLength({ min: 16, max: 16 }).withMessage('NIK harus 16 digit')
        .isNumeric().withMessage('NIK hanya boleh berisi angka'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
    body('confirm_password')
        .notEmpty().withMessage('Konfirmasi password wajib diisi')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Konfirmasi password tidak cocok');
            }
            return true;
        }),
    body('no_hp')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    body('sekolah_asal')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3 }).withMessage('Nama sekolah minimal 3 karakter'),
    handleValidationErrors
];

// ==============================================
// REGISTER GURU VALIDATION
// ==============================================
const validateRegisterGuru = [
    body('nama')
        .trim()
        .notEmpty().withMessage('Nama lengkap wajib diisi')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter')
        .matches(/^[a-zA-Z\s\.]+$/).withMessage('Nama hanya boleh berisi huruf'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('confirm_password')
        .notEmpty().withMessage('Konfirmasi password wajib diisi')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Konfirmasi password tidak cocok');
            }
            return true;
        }),
    body('sekolah_asal')
        .trim()
        .notEmpty().withMessage('Asal sekolah wajib diisi'),
    body('mata_pelajaran')
        .trim()
        .notEmpty().withMessage('Mata pelajaran wajib diisi'),
    body('no_hp')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    handleValidationErrors
];

// ==============================================
// KUOTA VALIDATION
// ==============================================
const validateKuota = [
    body('tahun_ajaran')
        .trim()
        .notEmpty().withMessage('Tahun ajaran wajib diisi')
        .matches(/^\d{4}\/\d{4}$/).withMessage('Format tahun ajaran harus YYYY/YYYY'),
    body('max_peserta')
        .notEmpty().withMessage('Maksimal peserta wajib diisi')
        .isInt({ min: 1 }).withMessage('Maksimal peserta harus angka positif'),
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'closed']).withMessage('Status tidak valid'),
    handleValidationErrors
];

// ==============================================
// PENDAFTARAN VALIDATION
// ==============================================
const validatePendaftaran = [
    body('kuota_id')
        .notEmpty().withMessage('Kuota harus dipilih')
        .isInt().withMessage('Kuota tidak valid'),
    handleValidationErrors
];

// ==============================================
// PROFILE UPDATE VALIDATION
// ==============================================
const validateProfileUpdate = [
    body('nama')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('no_hp')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^(\+62|62|0)[0-9]{9,12}$/).withMessage('Format nomor HP tidak valid'),
    handleValidationErrors
];

// ==============================================
// PASSWORD CHANGE VALIDATION
// ==============================================
const validatePasswordChange = [
    body('current_password')
        .notEmpty().withMessage('Password saat ini wajib diisi'),
    body('new_password')
        .notEmpty().withMessage('Password baru wajib diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
    body('confirm_new_password')
        .notEmpty().withMessage('Konfirmasi password wajib diisi')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Konfirmasi password tidak cocok');
            }
            return true;
        }),
    handleValidationErrors
];

// ==============================================
// ADMIN CREATION VALIDATION
// ==============================================
const validateAdminCreation = [
    body('nama')
        .trim()
        .notEmpty().withMessage('Nama wajib diisi')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Format email tidak valid')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password wajib diisi')
        .isLength({ min: 8 }).withMessage('Password admin minimal 8 karakter')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan simbol'),
    handleValidationErrors
];

// ==============================================
// FILE UPLOAD VALIDATION
// ==============================================
const validateFileUpload = (fieldName, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        const file = req.file || (req.files && req.files[fieldName]);
        
        if (!file) {
            return next(); // No file uploaded, skip validation
        }
        
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            req.flash('error', 'Format file tidak diizinkan. Gunakan: ' + allowedTypes.join(', '));
            return res.redirect('back');
        }
        
        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            req.flash('error', `Ukuran file maksimal ${maxSizeMB}MB`);
            return res.redirect('back');
        }
        
        next();
    };
};

// ==============================================
// SANITIZE INPUT (XSS Prevention)
// ==============================================
const sanitizeInput = (req, res, next) => {
    // Recursively sanitize all string values in req.body
    const sanitize = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove HTML tags
                obj[key] = obj[key].replace(/<[^>]*>/g, '');
                // Escape special characters
                obj[key] = obj[key]
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    if (req.body) {
        sanitize(req.body);
    }
    
    next();
};

// ==============================================
// RATE LIMITING HELPER
// ==============================================
const checkRateLimit = (maxAttempts, windowMs) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const key = req.ip + (req.body.email || '');
        const now = Date.now();
        const record = attempts.get(key);
        
        if (record) {
            if (now - record.firstAttempt > windowMs) {
                // Reset window
                attempts.set(key, { count: 1, firstAttempt: now });
            } else if (record.count >= maxAttempts) {
                const remainingTime = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000 / 60);
                return res.status(429).json({
                    success: false,
                    error: `Terlalu banyak percobaan. Coba lagi dalam ${remainingTime} menit.`
                });
            } else {
                record.count++;
            }
        } else {
            attempts.set(key, { count: 1, firstAttempt: now });
        }
        
        next();
    };
};

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegisterPeserta,
    validateRegisterGuru,
    validateKuota,
    validatePendaftaran,
    validateProfileUpdate,
    validatePasswordChange,
    validateAdminCreation,
    validateFileUpload,
    sanitizeInput,
    checkRateLimit
};