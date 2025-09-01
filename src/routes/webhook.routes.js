const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/v1/webhooks
// @desc    Get webhooks
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/webhooks
// @desc    Create webhook
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Webhook created' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/webhooks/incoming/:id
// @desc    Handle incoming webhook
// @access  Public
router.post('/incoming/:id', async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;