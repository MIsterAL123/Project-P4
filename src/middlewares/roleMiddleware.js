// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).redirect('/auth/login');
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('errors/403', {
        title: 'Access Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).render('errors/403', {
      title: 'Admin Only',
      message: 'This area is restricted to administrators only'
    });
  }
  next();
};

// Check if user is guru
const isGuru = (req, res, next) => {
  if (!req.user || req.user.role !== 'guru') {
    return res.status(403).render('errors/403', {
      title: 'Guru Only',
      message: 'This area is restricted to guru only'
    });
  }

  // Additional check for guru status
  if (req.user.guru_status !== 'active') {
    return res.status(403).render('errors/403', {
      title: 'Account Not Active',
      message: 'Your account is not yet approved by admin'
    });
  }

  next();
};

// Check if user is peserta
const isPeserta = (req, res, next) => {
  if (!req.user || req.user.role !== 'peserta') {
    return res.status(403).render('errors/403', {
      title: 'Peserta Only',
      message: 'This area is restricted to peserta only'
    });
  }
  next();
};

// Check if guru account is approved
const isApprovedGuru = (req, res, next) => {
  if (!req.user || req.user.role !== 'guru') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.guru_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval or has been rejected'
    });
  }

  next();
};

module.exports = {
  restrictTo,
  isAdmin,
  isGuru,
  isPeserta,
  isApprovedGuru
};