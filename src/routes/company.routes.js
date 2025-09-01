const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Company = require('../models/Company');

// @route   GET /api/v1/companies
// @desc    Get all companies
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    const companies = await Company.find().populate('ownerId', 'firstName lastName email');
    res.json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/companies/:id
// @desc    Get company by ID
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('ownerId', 'firstName lastName email');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/companies
// @desc    Create company
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    const company = new Company({ ...req.body, ownerId: req.user.userId });
    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/companies/:id
// @desc    Update company
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/companies/:id
// @desc    Delete company
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;