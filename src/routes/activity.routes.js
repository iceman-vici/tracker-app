const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST /api/v1/activity/log
// @desc    Log activity
// @access  Private
router.post('/log', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Activity logged' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/activity
// @desc    Get activity logs
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;