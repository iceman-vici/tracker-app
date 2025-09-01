const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// @route   GET /api/v1/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    const { projectId, status, priority, assignedTo, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('projectId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Task.countDocuments(query);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('projectId', 'name description');
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/tasks
// @desc    Create task
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    const task = new Task({
      ...req.body,
      createdBy: req.user.userId
    });
    
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    task.comments.push({
      text: req.body.text,
      userId: req.user.userId
    });
    
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

module.exports = router;