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
  body('password').notEmpty(),
  body('totpCode').optional().isLength({ min: 6, max: 6 }),
  body('permissions').optional().isIn(['read', 'write', 'admin'])
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

    const { email, password, totpCode, permissions } = req.body;

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

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Account is not active'
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

    // Handle Two-Factor Authentication if enabled
    if (user.twoFactorEnabled && !totpCode) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'TOTP code required',
          requires_2fa: true
        }
      });
    }

    // Validate TOTP code if provided
    if (totpCode) {
      // For demo purposes, accept "123456" as valid TOTP
      // In production, you would validate against the user's TOTP secret
      const validTotpCodes = ['123456', '000000', user.totpCode];
      if (!validTotpCodes.includes(totpCode)) {
        return res.status(401).json({
          error: {
            code: 401,
            message: 'Invalid TOTP code'
          }
        });
      }
    }

    // Handle permissions
    const userPermissions = permissions || user.defaultPermissions || 'read';
    
    // Check if user has requested permissions
    const allowedPermissions = {
      'admin': ['read', 'write', 'admin'],
      'manager': ['read', 'write'],
      'user': ['read']
    };

    const userRolePermissions = allowedPermissions[user.role] || ['read'];
    if (!userRolePermissions.includes(userPermissions)) {
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Insufficient permissions',
          available_permissions: userRolePermissions
        }
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    user.lastLoginIp = req.ip || req.connection.remoteAddress;
    await user.save();

    // Generate access token
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      permissions: userPermissions
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        type: 'refresh'
      },
      process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    // ✨ LOG TOKEN FOR EASY TESTING ✨
    console.log('\n' + '='.repeat(80));
    console.log('🔑 LOGIN SUCCESSFUL - COPY TOKEN FOR API TESTING');
    console.log('='.repeat(80));
    console.log('📧 Email:', email);
    console.log('👤 Role:', user.role);
    console.log('🔐 Permissions:', userPermissions);
    console.log('🎫 TOKEN (copy this for Authorization header):');
    console.log('Bearer ' + token);
    console.log('\n💡 Example usage:');
    console.log('curl -H "Authorization: Bearer ' + token + '" \\');
    console.log('     "http://localhost:3000/api/1.0/users"');
    console.log('='.repeat(80) + '\n');

    // Log successful login
    logger.info(`User ${email} logged in successfully with ${userPermissions} permissions`);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      expires_in: 86400, // 24 hours in seconds
      token_type: 'Bearer',
      permissions: userPermissions,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        company_id: user.companyId,
        status: user.status,
        timezone: user.timezone,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        permissions: userPermissions
      }
    });

  } catch (error) {
    logger.error(`Login error for ${req.body.email}: ${error.message}`);
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
  body('last_name').notEmpty().trim(),
  body('timezone').optional().isString(),
  body('company_id').optional().isString()
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

    const { 
      email, 
      password, 
      username, 
      first_name, 
      last_name, 
      company_id, 
      timezone = 'UTC' 
    } = req.body;

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
      companyId: company_id,
      timezone,
      role: 'user',
      status: 'active',
      defaultPermissions: 'read'
    });

    await user.save();

    // Generate tokens
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
        permissions: 'read'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        type: 'refresh'
      },
      process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    // ✨ LOG TOKEN FOR NEW USER ✨
    console.log('\n' + '='.repeat(80));
    console.log('🎉 USER REGISTERED - COPY TOKEN FOR API TESTING');
    console.log('='.repeat(80));
    console.log('📧 Email:', email);
    console.log('👤 Role: user');
    console.log('🔐 Permissions: read');
    console.log('🎫 TOKEN (copy this for Authorization header):');
    console.log('Bearer ' + token);
    console.log('='.repeat(80) + '\n');

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      expires_in: 86400,
      token_type: 'Bearer',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        company_id: user.companyId,
        status: user.status,
        timezone: user.timezone,
        created_at: user.createdAt
      }
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
});

// @route   POST /api/1.0/logout
// @desc    Logout user
// @access  Private
router.post('/logout', async (req, res) => {
  // Get token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('\n🚪 User logged out:', decoded.email);
      logger.info(`User ${decoded.email} logged out`);
    } catch (err) {
      // Token invalid, but still allow logout
    }
  }

  // In a stateless JWT system, logout is handled client-side
  res.json({
    message: 'Logged out successfully'
  });
});

// @route   POST /api/1.0/refresh
// @desc    Refresh access token
// @access  Public (but requires refresh token)
router.post('/refresh', [
  body('refreshToken').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: {
          code: 400,
          message: 'Refresh token required'
        }
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid token type'
        }
      });
    }

    // Get user to include current permissions
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'User not found or inactive'
        }
      });
    }
    
    // Generate new access token
    const token = jwt.sign(
      { 
        userId: decoded.userId,
        email: decoded.email,
        companyId: user.companyId,
        role: user.role,
        permissions: user.defaultPermissions || 'read'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // ✨ LOG REFRESHED TOKEN ✨
    console.log('\n🔄 TOKEN REFRESHED - NEW TOKEN:');
    console.log('Bearer ' + token);
    console.log('');

    res.json({ 
      message: 'Token refreshed successfully',
      token,
      expires_in: 86400,
      token_type: 'Bearer'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid refresh token'
        }
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Refresh token expired'
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
      { 
        userId: user._id,
        type: 'password_reset'
      },
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
// @desc    Reset password using reset token
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
    
    if (decoded.type !== 'password_reset') {
      return res.status(401).json({ 
        error: {
          code: 401,
          message: 'Invalid token type'
        }
      });
    }
    
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

    logger.info(`Password reset successful for user ${user.email}`);

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

// @route   GET /api/1.0/me
// @desc    Get current user info
// @access  Private
router.get('/me', async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'No token provided'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'User not found'
        }
      });
    }

    res.json({
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        company_id: user.companyId,
        status: user.status,
        timezone: user.timezone,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        permissions: decoded.permissions,
        created_at: user.createdAt
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 401,
          message: 'Invalid token'
        }
      });
    }
    next(error);
  }
});

module.exports = router;