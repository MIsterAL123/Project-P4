// ==============================================
// ERROR MIDDLEWARE
// Website P4 Jakarta
// ==============================================

const logger = require('../utils/logger');

// Not Found Handler (404)
const notFound = (req, res, next) => {
    res.status(404);
    
    // Check if it's an API request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
            success: false,
            error: 'Resource not found',
            path: req.originalUrl
        });
    }
    
    // Render 404 page
    res.render('errors/404', {
        title: 'Halaman Tidak Ditemukan',
        url: req.originalUrl
    });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        user: req.user?.id || 'anonymous'
    });
    
    // Set status code
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode);
    
    // Check if it's an API request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
            success: false,
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
    
    // Handle specific error types
    if (statusCode === 401) {
        return res.redirect('/auth/login');
    }
    
    if (statusCode === 403) {
        return res.render('errors/403', {
            title: 'Akses Ditolak',
            message: err.message || 'Anda tidak memiliki izin untuk mengakses halaman ini.'
        });
    }
    
    if (statusCode === 404) {
        return res.render('errors/404', {
            title: 'Halaman Tidak Ditemukan',
            url: req.originalUrl
        });
    }
    
    // Default: 500 error page
    res.render('errors/500', {
        title: 'Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan pada server.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

// Async error wrapper - wrap async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Validation error handler
const handleValidationError = (err, req, res, next) => {
    if (err.name === 'ValidationError' || err.type === 'validation') {
        const errors = Object.values(err.errors || {}).map(e => e.message || e);
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({
                success: false,
                errors
            });
        }
        
        req.flash('error', errors.join(', '));
        return res.redirect('back');
    }
    
    next(err);
};

// Database error handler
const handleDatabaseError = (err, req, res, next) => {
    // MySQL error codes
    const dbErrors = {
        'ER_DUP_ENTRY': 'Data sudah ada dalam database',
        'ER_NO_REFERENCED_ROW': 'Data referensi tidak ditemukan',
        'ER_ROW_IS_REFERENCED': 'Data tidak dapat dihapus karena masih digunakan',
        'ER_DATA_TOO_LONG': 'Data terlalu panjang',
        'ER_TRUNCATED_WRONG_VALUE': 'Format data tidak valid'
    };
    
    if (err.code && dbErrors[err.code]) {
        logger.error(`Database error: ${err.code}`, { 
            message: err.message,
            sql: err.sql 
        });
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({
                success: false,
                error: dbErrors[err.code]
            });
        }
        
        req.flash('error', dbErrors[err.code]);
        return res.redirect('back');
    }
    
    next(err);
};

// CSRF error handler
const handleCSRFError = (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        logger.warn('CSRF token invalid', {
            ip: req.ip,
            url: req.originalUrl
        });
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({
                success: false,
                error: 'Session expired. Please refresh the page.'
            });
        }
        
        req.flash('error', 'Session telah berakhir. Silakan refresh halaman.');
        return res.redirect('back');
    }
    
    next(err);
};

// Multer file upload error handler
const handleMulterError = (err, req, res, next) => {
    if (err.name === 'MulterError') {
        let message;
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'Ukuran file terlalu besar';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Terlalu banyak file';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Format file tidak didukung';
                break;
            default:
                message = 'Gagal mengupload file';
        }
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({
                success: false,
                error: message
            });
        }
        
        req.flash('error', message);
        return res.redirect('back');
    }
    
    next(err);
};

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    handleValidationError,
    handleDatabaseError,
    handleCSRFError,
    handleMulterError
};