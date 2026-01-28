const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Grant access to route
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// IP rate limiting per user
exports.ipRateLimit = (req, res, next) => {
  req.ipAddress = req.ip || req.connection.remoteAddress;
  req.userAgent = req.headers['user-agent'];
  next();
};

// Check transaction PIN
exports.checkPin = async (req, res, next) => {
  const { pin } = req.body;
  
  if (!pin) {
    return res.status(400).json({
      success: false,
      error: 'Transaction PIN is required'
    });
  }

  const user = await User.findById(req.user.id).select('+pin');
  
  if (!user.pin) {
    return res.status(400).json({
      success: false,
      error: 'Transaction PIN not set. Please set a PIN first.'
    });
  }

  const isPinMatch = await user.comparePin(pin);
  
  if (!isPinMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid transaction PIN'
    });
  }

  next();
};
