const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

// Protect routes - require login
const protect = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Attach user when a valid token is present, but allow public access.
const optionalProtect = async (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    req.user = null;
  }

  next();
};

const hasAdminPower = (user) => user && ['admin', 'chaplain'].includes(user.role);

// Admin-power middleware
const admin = (req, res, next) => {
  if (hasAdminPower(req.user)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin or Chaplain access required' });
  }
};

// Chaplain or Admin middleware
const chaplain = (req, res, next) => {
  if (hasAdminPower(req.user)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Chaplain or Admin access required' });
  }
};

module.exports = { protect, optionalProtect, admin, chaplain, hasAdminPower };
