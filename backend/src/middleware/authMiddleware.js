const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
