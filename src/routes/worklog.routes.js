const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { db, generateId } = require('../config/database');

// @route   GET /api/1.0/worklogs
// @desc    Get worklogs (Time Doctor compatible)
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    const { user_id, company_id, from, to, project_id, task_id } = req.query;
    
    let worklogs = db.timeEntries || [];
    
    // Filter worklogs
    if (user_id) worklogs = worklogs.filter(w => w.user_id === user_id);
    if (company_id) worklogs = worklogs.filter(w => w.company_id === company_id);
    if (project_id) worklogs = worklogs.filter(w => w.project_id === project_id);
    if (task_id) worklogs = worklogs.filter(w => w.task_id === task_id);
    
    // Date filtering
    if (from) {
      const fromDate = new Date(from);
      worklogs = worklogs.filter(w => new Date(w.start_time) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      worklogs = worklogs.filter(w => new Date(w.start_time) <= toDate);
    }
    
    res.json({
      data: worklogs,
      total: worklogs.length
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/1.0/worklogs
// @desc    Create worklog entry
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    const worklog = {
      id: generateId(),
      user_id: req.user.userId,
      company_id: req.user.companyId,
      project_id: req.body.project_id,
      task_id: req.body.task_id,
      start_time: req.body.start_time || new Date().toISOString(),
      end_time: req.body.end_time,
      duration: req.body.duration || 0,
      description: req.body.description,
      is_manual: req.body.is_manual || false,
      keyboard_strokes: req.body.keyboard_strokes || 0,
      mouse_clicks: req.body.mouse_clicks || 0,
      active_window: req.body.active_window,
      created_at: new Date().toISOString()
    };
    
    if (!db.timeEntries) db.timeEntries = [];
    db.timeEntries.push(worklog);
    
    res.status(201).json({
      data: worklog,
      message: 'Worklog created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/1.0/worklogs/:id
// @desc    Get single worklog
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    const worklog = (db.timeEntries || []).find(w => w.id === req.params.id);
    
    if (!worklog) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Worklog not found'
        }
      });
    }
    
    res.json({ data: worklog });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/1.0/worklogs/:id
// @desc    Update worklog
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    const index = (db.timeEntries || []).findIndex(w => w.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Worklog not found'
        }
      });
    }
    
    db.timeEntries[index] = {
      ...db.timeEntries[index],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    res.json({
      data: db.timeEntries[index],
      message: 'Worklog updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/1.0/worklogs/:id
// @desc    Delete worklog
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const index = (db.timeEntries || []).findIndex(w => w.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        error: {
          code: 404,
          message: 'Worklog not found'
        }
      });
    }
    
    db.timeEntries.splice(index, 1);
    
    res.json({
      message: 'Worklog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;