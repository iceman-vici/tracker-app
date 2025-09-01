const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/v1/invoices
// @desc    Get invoices
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/invoices
// @desc    Create invoice
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Invoice created' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;