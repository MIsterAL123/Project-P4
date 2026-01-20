// Konfigurasi JWT & session
const jwt = require('jsonwebtoken');

// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-default-secret-key',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

// Get token from request
const getTokenFromRequest = (req) => {
  // Check header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  
  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};

// Set token cookie options
const getCookieOptions = () => {
  return {
    expires: new Date(Date.now() + jwtConfig.cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
};

module.exports = {
  jwtConfig,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  getCookieOptions
};