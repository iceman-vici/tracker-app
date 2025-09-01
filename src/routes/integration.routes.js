const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/v1/integrations
// @desc    Get available integrations
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ 
      success: true, 
      data: [
        { name: 'Slack', status: 'available' },
        { name: 'GitHub', status: 'available' },
        { name: 'Jira', status: 'coming_soon' }
      ] 
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/integrations/connect
// @desc    Connect integration
// @access  Private
router.post('/connect', auth, async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Integration connected' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;