const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { validate, schemas } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// @route   POST /api/v1/auth/register
// @desc    Register new user and company
// @access  Public
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, timezone, role } = req.body;

    logger.info('New registration attempt', { email, companyName });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration failed - user exists', { email });
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create company first
    const company = new Company({
      name: companyName || `${firstName}'s Company`,
      owner: null, // Will be updated after user creation
      settings: {
        timezone: timezone || 'UTC'
      }
    });

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'owner',
      company: company._id,
      timezone
    });

    // Update company owner
    company.owner = user._id;
    company.usage.currentUsers = 1;

    // Save both
    await company.save();
    await user.save();

    // Generate tokens
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();

    logger.info('User registered successfully', { 
      userId: user._id, 
      companyId: company._id 
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('user:registered', {
        userId: user._id,
        companyId: company._id,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        company,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', { email });

    // Find user with company
    const user = await User.findOne({ email })
      .populate('company');

    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { email });
      
      // Update failed login attempts
      user.metadata.failedLoginAttempts++;
      if (user.metadata.failedLoginAttempts >= 5) {
        user.metadata.accountLocked = true;
        user.metadata.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.metadata.accountLocked && user.metadata.accountLockedUntil > new Date()) {
      logger.warn('Login failed - account locked', { email });
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Please try again later.'
      });
    }

    // Reset failed attempts and update login info
    user.metadata.failedLoginAttempts = 0;
    user.metadata.accountLocked = false;
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount++;
    user.metadata.ipAddress = req.ip;
    user.metadata.userAgent = req.get('user-agent');
    user.lastActive = new Date();

    // Generate tokens
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();

    await user.save();

    logger.info('User logged in successfully', { userId: user._id });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('user:login', {
        userId: user._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        company: user.company,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Remove current token
    user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== req.token);
    await user.save();

    logger.info('User logged out', { userId: user._id });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('user:logout', {
        userId: user._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Remove all tokens
    user.tokens = [];
    user.refreshTokens = [];
    await user.save();

    logger.info('User logged out from all devices', { userId: user._id });

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    logger.error('Logout all error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      'refreshTokens.token': refreshToken
    }).populate('company');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const token = await user.generateAuthToken();

    logger.info('Token refreshed', { userId: user._id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.security.passwordResetToken = resetToken;
    user.security.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // TODO: Send email with reset link
    logger.info('Password reset requested', { userId: user._id });

    res.json({
      success: true,
      message: 'If an account exists, a password reset link has been sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.id,
      'security.passwordResetToken': token,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.tokens = []; // Logout from all devices
    user.refreshTokens = [];
    await user.save();

    logger.info('Password reset successful', { userId: user._id });

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// @route   POST /api/v1/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed', { userId: user._id });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// @route   GET /api/v1/auth/verify
// @desc    Verify token
// @access  Private
router.get('/verify', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user.toJSON()
    }
  });
});

module.exports = router;