const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @route   GET /api/v1/projects
// @desc    Get all projects
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const query = { companyId: req.user.companyId };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const projects = await Project.find(query)
      .populate('managerId', 'firstName lastName')
      .populate('teamMembers', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
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

// @route   GET /api/v1/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('managerId', 'firstName lastName email')
      .populate('teamMembers', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/projects
// @desc    Create project
// @access  Private
router.post('/', auth, async (req, res, next) => {
  try {
    const project = new Project({
      ...req.body,
      companyId: req.user.companyId,
      managerId: req.body.managerId || req.user.userId
    });
    
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    
    // Delete all tasks associated with the project
    await Task.deleteMany({ projectId: req.params.id });
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/projects/:id/tasks
// @desc    Get all tasks for a project
// @access  Private
router.get('/:id/tasks', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.params.id })
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');
    
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

module.exports = router;