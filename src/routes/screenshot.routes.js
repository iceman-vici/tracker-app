const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST /api/v1/screenshots/upload
// @desc    Upload screenshot
// @access  Private
router.post('/upload', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Screenshot uploaded' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/screenshots
// @desc    Get screenshots
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;