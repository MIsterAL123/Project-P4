const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Protect routes - check if user is authenticated
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies or authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).redirect('/auth/login');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await query(
      'SELECT u.*, a.id as admin_id, g.id as guru_id, g.status as guru_status, p.id as peserta_id FROM users u LEFT JOIN admin a ON u.id = a.user_id LEFT JOIN guru g ON u.id = g.user_id LEFT JOIN peserta p ON u.id = p.user_id WHERE u.id = ?',
      [decoded.id]
    );

    if (!user || user.length === 0) {
      return res.status(401).redirect('/auth/login');
    }

    // Check if guru account is approved
    if (user[0].role === 'guru' && user[0].guru_status !== 'active') {
      return res.status(403).render('errors/403', {
        title: 'Account Pending',
        message: 'Your account is pending approval. Please wait for admin verification.'
      });
    }

    // Attach user to request and response locals
    req.user = user[0];
    res.locals.user = user[0];
    res.locals.currentUser = user[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).redirect('/auth/login');
  }
};

// Optional authentication - doesn't block if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await query(
        'SELECT u.*, a.id as admin_id, g.id as guru_id, p.id as peserta_id FROM users u LEFT JOIN admin a ON u.id = a.user_id LEFT JOIN guru g ON u.id = g.user_id LEFT JOIN peserta p ON u.id = p.user_id WHERE u.id = ?',
        [decoded.id]
      );

      if (user && user.length > 0) {
        req.user = user[0];
        res.locals.user = user[0];
        res.locals.currentUser = user[0];
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  optionalAuth
};