const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, 'tokens.token': token })
      .select('-password');

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    req.userId = user._id;

    logger.debug(`User ${user.email} authenticated successfully`);
    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error.message });
    res.status(401).json({ 
      success: false, 
      message: 'Please authenticate' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
      throw new Error('Admin access required');
    }
    
    next();
  } catch (error) {
    logger.warn('Admin authentication failed', { 
      userId: req.user?._id, 
      role: req.user?.role 
    });
    res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};

const managerAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    const allowedRoles = ['admin', 'owner', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error('Manager access required');
    }
    
    next();
  } catch (error) {
    logger.warn('Manager authentication failed', { 
      userId: req.user?._id, 
      role: req.user?.role 
    });
    res.status(403).json({ 
      success: false, 
      message: 'Manager access required' 
    });
  }
};

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');

    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new Error();
    }

    logger.debug('API key authentication successful');
    next();
  } catch (error) {
    logger.warn('API key authentication failed');
    res.status(401).json({ 
      success: false, 
      message: 'Invalid API key' 
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  managerAuth,
  apiKeyAuth
};