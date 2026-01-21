// ==============================================
// APP.JS - Express Application Configuration
// Website P4 Jakarta
// ==============================================

/**
 * This file can be used to create an app instance for testing purposes
 * The main server configuration is in server.js
 */

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

// Import utilities
const logger = require('./utils/logger');
const { 
    handleMulterError, 
    handleValidationError, 
    handleDatabaseError, 
    errorHandler 
} = require('./middlewares/errorMiddleware');

// Import routes
const routes = require('./routes');

/**
 * Create Express application
 * @returns {Express.Application} Configured Express app
 */
function createApp() {
    const app = express();

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                connectSrc: ["'self'"],
            },
        },
    }));

    // CORS configuration
    app.use(cors({
        origin: process.env.APP_URL || 'http://localhost:3000',
        credentials: true
    }));

    // Compression middleware
    app.use(compression());

    // Body parser middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parser
    app.use(cookieParser());

    // Session configuration
    app.use(session({
        secret: process.env.SESSION_SECRET || 'p4-jakarta-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: parseInt(process.env.SESSION_EXPIRE) || 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }
    }));

    // View engine setup
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // Disable view cache in development
    if (process.env.NODE_ENV !== 'production') {
        app.set('view cache', false);
    }

    // EJS Layouts
    app.use(expressLayouts);
    app.set('layout', 'layouts/main');
    app.set('layout extractScripts', true);
    app.set('layout extractStyles', true);

    // Static files
    app.use(express.static(path.join(__dirname, '../public')));
    app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

    // Make user and current path available in all views
    app.use((req, res, next) => {
        res.locals.user = req.session.user || null;
        res.locals.currentUser = req.user || req.session.user || null;
        res.locals.currentPath = req.path || '';
        res.locals.success = req.session.success || null;
        res.locals.error = req.session.error || null;
        delete req.session.success;
        delete req.session.error;
        next();
    });

    // Routes
    app.use('/', routes);

    // 404 handler
    app.use((req, res, next) => {
        res.status(404).render('errors/404', {
            title: 'Halaman Tidak Ditemukan',
            message: 'Halaman yang Anda cari tidak ditemukan',
            url: req.originalUrl
        });
    });

    // Error handlers (order matters)
    app.use(handleMulterError);
    app.use(handleValidationError);
    app.use(handleDatabaseError);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;