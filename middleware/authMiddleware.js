import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Basic token format validation
      if (!token || token.split('.').length !== 3) {
        console.warn('Invalid token format received');
        res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token format'
        });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findOne({ _id: decoded.id }).select('-password');

      if (!req.user) {
        console.warn('User not found for token');
        res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);

      // Handle different types of JWT errors gracefully
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token'
        });
        return;
      } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Not authorized, token expired'
        });
        return;
      } else {
        res.status(401).json({
          success: false,
          message: 'Not authorized, token verification failed'
        });
        return;
      }
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
    return;
  }
};

// Check if user is authenticated but don't fail if no token (for optional auth)
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Basic token format validation
      if (!token || token.split('.').length !== 3) {
        console.warn('Invalid token format received');
        // Don't return error, just continue without user
        next();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findOne({ _id: decoded.id }).select('-password');

      if (!req.user) {
        console.warn('User not found for token');
        // Don't return error, just continue without user
        next();
        return;
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      // Don't return error, just continue without user
      next();
    }
  } else {
    // No token provided, continue without user
    next();
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a Super Admin');
  }
};


export { protect, optionalProtect, superAdmin };



