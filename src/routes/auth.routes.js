const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

// @route   POST /api/1.0/login
// @desc    Login user (Time Doctor compatible)
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'Invalid request parameters',
          details: errors.array()
        }
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid credentials'
        }
      });
    }

    // For demo purposes, accept any password for now
    // In production, you would properly hash and compare passwords
    const isMatch = password === 'password123' || password === user.password;
    
    if (!isMatch && user.password) {
      // Try to compare hashed password
      try {
        const hashMatch = await bcrypt.compare(password, user.password);
        if (!hashMatch) {
          return res.status(401).json({ 
            error: {
              code: 401,
              message: 'Invalid credentials'
            }
          });
        }
      } catch (err) {
        return res.status(401).json({ 
          error: {
            code: 401,
            message: 'Invalid credentials'
          }
        });
      }
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        company_id: user.companyId
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/1.0/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3 }).trim(),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { email, password, username, first_name, last_name, company_id } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'User already exists with this email or username'
        }
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      username,
      firstName: first_name,
      lastName: last_name,
      companyId: company_id
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        company_id: user.companyId
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/1.0/logout
// @desc    Logout user
// @access  Private
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  res.json({
    message: 'Logged out successfully'
  });
});

// @route   POST /api/1.0/refresh
// @desc    Refresh token
// @access  Private
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Refresh token required'
        }
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret');
    
    // Generate new access token
    const token = jwt.sign(
      { 
        userId: decoded.userId,
        email: decoded.email,
        companyId: decoded.companyId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({ token });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid refresh token'
        }
      });
    }
    next(error);
  }
});

// @route   POST /api/1.0/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'Invalid email format'
        }
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found'
        }
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset token
    logger.info(`Password reset token generated for ${email}: ${resetToken}`);

    res.json({
      message: 'Password reset email sent',
      // In production, don't send the token in response
      ...(process.env.NODE_ENV === 'development' && { reset_token: resetToken })
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/1.0/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'Invalid request',
          details: errors.array()
        }
      });
    }

    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user and update password
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found'
        }
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid or expired reset token'
        }
      });
    }
    next(error);
  }
});

module.exports = router;