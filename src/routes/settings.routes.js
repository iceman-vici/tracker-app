const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/v1/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ 
      success: true, 
      data: {
        notifications: {
          email: true,
          push: true,
          desktop: true
        },
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
      } 
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/settings
// @desc    Update user settings
// @access  Private
router.put('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;