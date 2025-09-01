const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

// @route   POST /api/v1/time-tracking/start
// @desc    Start time tracking
// @access  Private
router.post('/start', auth, validate(schemas.startTimer), async (req, res) => {
  try {
    const { projectId, taskId, description, tags } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;

    logger.info('Starting time tracking', { userId, projectId, taskId });

    // Check if user has a running timer
    const runningTimer = await TimeEntry.findOne({
      user: userId,
      status: 'running'
    });

    if (runningTimer) {
      return res.status(400).json({
        success: false,
        message: 'You already have a running timer. Please stop it first.'
      });
    }

    // Validate project and task if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project || project.company.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task || task.company.toString() !== companyId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      user: userId,
      company: companyId,
      project: projectId,
      task: taskId,
      startTime: new Date(),
      description,
      tags,
      status: 'running',
      metadata: {
        source: 'web'
      }
    });

    await timeEntry.save();

    logger.info('Time tracking started', { timeEntryId: timeEntry._id });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('timer:started', {
        timeEntry,
        timestamp: new Date()
      });
      
      // Notify team members if project is set
      if (projectId) {
        io.to(`project:${projectId}`).emit('project:timer:started', {
          userId,
          userName: req.user.fullName,
          projectId,
          timestamp: new Date()
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      data: timeEntry
    });
  } catch (error) {
    logger.error('Start timer error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to start timer',
      error: error.message
    });
  }
});

// @route   POST /api/v1/time-tracking/stop
// @desc    Stop time tracking
// @access  Private
router.post('/stop', auth, async (req, res) => {
  try {
    const { timeEntryId } = req.body;
    const userId = req.user._id;

    logger.info('Stopping time tracking', { userId, timeEntryId });

    const timeEntry = await TimeEntry.findOne({
      _id: timeEntryId,
      user: userId,
      status: 'running'
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Running timer not found'
      });
    }

    // Stop the timer
    await timeEntry.stop();

    // Update project stats if applicable
    if (timeEntry.project) {
      const project = await Project.findById(timeEntry.project);
      if (project) {
        project.stats.totalHours += timeEntry.duration / 3600;
        if (timeEntry.billable) {
          project.stats.billableHours += timeEntry.duration / 3600;
        }
        project.stats.lastActivity = new Date();
        await project.save();
      }
    }

    // Update task actual hours if applicable
    if (timeEntry.task) {
      const task = await Task.findById(timeEntry.task);
      if (task) {
        await task.updateProgress();
      }
    }

    logger.info('Time tracking stopped', { 
      timeEntryId: timeEntry._id, 
      duration: timeEntry.duration 
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('timer:stopped', {
        timeEntry,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      data: timeEntry
    });
  } catch (error) {
    logger.error('Stop timer error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to stop timer',
      error: error.message
    });
  }
});

// @route   GET /api/v1/time-tracking/current
// @desc    Get current running timer
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const runningTimer = await TimeEntry.findOne({
      user: userId,
      status: 'running'
    })
    .populate('project', 'name color')
    .populate('task', 'title');

    res.json({
      success: true,
      data: runningTimer
    });
  } catch (error) {
    logger.error('Get current timer error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get current timer',
      error: error.message
    });
  }
});

// @route   GET /api/v1/time-tracking/entries
// @desc    Get time entries with filters
// @access  Private
router.get('/entries', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      projectId, 
      taskId, 
      userId: queryUserId,
      status,
      billable,
      page = 1, 
      limit = 20,
      sort = '-startTime'
    } = req.query;

    const filter = {
      company: req.user.company
    };

    // Add user filter (admin can see all, others see only their own)
    if (req.user.role === 'admin' || req.user.role === 'owner') {
      if (queryUserId) filter.user = queryUserId;
    } else {
      filter.user = req.user._id;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    // Other filters
    if (projectId) filter.project = projectId;
    if (taskId) filter.task = taskId;
    if (status) filter.status = status;
    if (billable !== undefined) filter.billable = billable === 'true';

    const timeEntries = await TimeEntry.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('project', 'name color')
      .populate('task', 'title')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TimeEntry.countDocuments(filter);

    // Calculate totals
    const aggregation = await TimeEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration' },
          billableDuration: {
            $sum: {
              $cond: ['$billable', '$duration', 0]
            }
          }
        }
      }
    ]);

    const totals = aggregation[0] || { totalDuration: 0, billableDuration: 0 };

    res.json({
      success: true,
      data: {
        entries: timeEntries,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        totals: {
          totalHours: (totals.totalDuration / 3600).toFixed(2),
          billableHours: (totals.billableDuration / 3600).toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Get time entries error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get time entries',
      error: error.message
    });
  }
});

// @route   PUT /api/v1/time-tracking/entries/:id
// @desc    Update time entry
// @access  Private
router.put('/entries/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const timeEntry = await TimeEntry.findOne({
      _id: id,
      user: userId
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // Don't allow updating running timers
    if (timeEntry.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a running timer'
      });
    }

    // Track if this is an edit
    if (!timeEntry.edited.isEdited) {
      timeEntry.edited.isEdited = true;
      timeEntry.edited.originalDuration = timeEntry.duration;
      timeEntry.edited.editedBy = userId;
      timeEntry.edited.editedAt = new Date();
      timeEntry.edited.reason = updates.editReason || 'Manual edit';
    }

    // Update allowed fields
    const allowedUpdates = ['description', 'project', 'task', 'tags', 'billable', 'startTime', 'endTime'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        timeEntry[field] = updates[field];
      }
    });

    // Recalculate duration if times changed
    if (updates.startTime || updates.endTime) {
      timeEntry.duration = Math.floor((timeEntry.endTime - timeEntry.startTime) / 1000);
    }

    await timeEntry.save();

    logger.info('Time entry updated', { timeEntryId: id });

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: timeEntry
    });
  } catch (error) {
    logger.error('Update time entry error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update time entry',
      error: error.message
    });
  }
});

// @route   DELETE /api/v1/time-tracking/entries/:id
// @desc    Delete time entry
// @access  Private
router.delete('/entries/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const timeEntry = await TimeEntry.findOne({
      _id: id,
      user: userId
    });

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // Don't allow deleting running timers
    if (timeEntry.status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a running timer'
      });
    }

    await timeEntry.deleteOne();

    logger.info('Time entry deleted', { timeEntryId: id });

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    logger.error('Delete time entry error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to delete time entry',
      error: error.message
    });
  }
});

// @route   POST /api/v1/time-tracking/manual
// @desc    Add manual time entry
// @access  Private
router.post('/manual', auth, async (req, res) => {
  try {
    const {
      projectId,
      taskId,
      description,
      tags,
      startTime,
      endTime,
      billable = true
    } = req.body;

    const userId = req.user._id;
    const companyId = req.user.company;

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check for overlapping entries
    const overlap = await TimeEntry.findOne({
      user: userId,
      $or: [
        { startTime: { $lte: start }, endTime: { $gte: start } },
        { startTime: { $lte: end }, endTime: { $gte: end } },
        { startTime: { $gte: start }, endTime: { $lte: end } }
      ]
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: 'Time entry overlaps with existing entry'
      });
    }

    const timeEntry = new TimeEntry({
      user: userId,
      company: companyId,
      project: projectId,
      task: taskId,
      description,
      tags,
      startTime: start,
      endTime: end,
      status: 'stopped',
      manual: true,
      billable,
      metadata: {
        source: 'manual'
      }
    });

    await timeEntry.save();

    logger.info('Manual time entry created', { timeEntryId: timeEntry._id });

    res.status(201).json({
      success: true,
      message: 'Manual time entry created successfully',
      data: timeEntry
    });
  } catch (error) {
    logger.error('Create manual entry error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create manual entry',
      error: error.message
    });
  }
});

module.exports = router;