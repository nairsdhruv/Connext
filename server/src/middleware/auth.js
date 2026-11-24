import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'connext_super_secret_jwt_key_local_dev_2026_change_in_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.connext_token) {
      token = req.cookies.connext_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'connext_super_secret_jwt_key_local_dev_2026_change_in_production'
    );

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact support.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.connext_token) {
      token = req.cookies.connext_token;
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'connext_super_secret_jwt_key_local_dev_2026_change_in_production'
      );
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch (err) {
    // Optional auth silently ignores invalid tokens
  }
  next();
};

export const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.headers?.cookie &&
        socket.handshake.headers.cookie
          .split(';')
          .find((c) => c.trim().startsWith('connext_token='))
          ?.split('=')[1]);

    if (!token) {
      return next(new Error('Authentication required for real-time chat.'));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'connext_super_secret_jwt_key_local_dev_2026_change_in_production'
    );

    const user = await User.findById(decoded.id).select('_id displayName avatar status');
    if (!user || user.status !== 'active') {
      return next(new Error('User not found or suspended.'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid socket authentication token.'));
  }
};
