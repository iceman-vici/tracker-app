const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const logger = require('../utils/logger');

// @route   GET /api/1.0/users
// @desc    Get users (Time Doctor compatible)
// @access  Private
router.get('/', auth, async (req, res, next) => {
  try {
    const {
      // Basic filters
      company,
      user: userId,
      manager,
      tag,
      self,
      detail = 'id',
      'task-project-names': taskProjectNames,
      'no-tag': noTag,
      'include-archived-users': includeArchivedUsers = 'false',
      deleted = 'false',
      
      // Pagination
      page = '1',
      limit = '20',
      sort = 'id',
      
      // Advanced filters
      'filter[id]': filterId,
      'filter[email]': filterEmail,
      'filter[name]': filterName,
      'filter[tag]': filterTag,
      'filter[keywords]': filterKeywords,
      'filter[role]': filterRole,
      'filter[showOnReports]': filterShowOnReports,
      'filter[invitePending]': filterInvitePending,
      'filter[inviteAccepted]': filterInviteAccepted,
      'filter[payrollAccess]': filterPayrollAccess,
      'filter[screenshots]': filterScreenshots,
      'filter[videos]': filterVideos,
      'filter[created]': filterCreated,
      'filter[hostName]': filterHostName,
      'filter[os]': filterOs,
      'filter[hiredAt]': filterHiredAt,
      'filter[lastTrack]': filterLastTrack,
      'filter[lastActiveTrack]': filterLastActiveTrack,
      'filter[clientVersion]': filterClientVersion,
      'filter[ip]': filterIp,
      'filter[show-on-reports]': filterShowOnReports2,
      'filter[payroll-access]': filterPayrollAccess2,
      'filter[host-name]': filterHostName2,
      'filter[hired-at]': filterHiredAt2,
      'filter[last-track]': filterLastTrack2,
      'filter[last-active-track]': filterLastActiveTrack2,
      'filter[client-version]': filterClientVersion2,
      'filter[invite-pending]': filterInvitePending2,
      'filter[invite-accepted]': filterInviteAccepted2,
      'filter[tag-count]': filterTagCount
    } = req.query;

    // Build base query
    let query = {};

    // Handle self parameter
    if (self === 'true') {
      query._id = req.user.userId;
    }

    // Handle company filter
    if (company) {
      query.companyId = company;
    }

    // Handle user filter
    if (userId) {
      query._id = userId;
    }

    // Handle manager filter
    if (manager) {
      query.managerId = manager;
    }

    // Handle archived users
    if (includeArchivedUsers !== 'true') {
      query.status = { $ne: 'archived' };
    }

    // Handle deleted users
    if (deleted !== 'true') {
      query.deleted = { $ne: true };
    }

    // Apply advanced filters
    if (filterId) query._id = filterId;
    if (filterEmail) query.email = new RegExp(filterEmail, 'i');
    if (filterName) {
      query.$or = [
        { firstName: new RegExp(filterName, 'i') },
        { lastName: new RegExp(filterName, 'i') },
        { username: new RegExp(filterName, 'i') }
      ];
    }
    if (filterRole) query.role = filterRole;

    // Handle keywords filter
    if (filterKeywords) {
      query.$or = [
        { firstName: new RegExp(filterKeywords, 'i') },
        { lastName: new RegExp(filterKeywords, 'i') },
        { email: new RegExp(filterKeywords, 'i') },
        { username: new RegExp(filterKeywords, 'i') }
      ];
    }

    // Handle boolean filters
    if (filterShowOnReports || filterShowOnReports2) {
      query.showOnReports = (filterShowOnReports || filterShowOnReports2) === 'true';
    }
    if (filterInvitePending || filterInvitePending2) {
      query.invitePending = (filterInvitePending || filterInvitePending2) === 'true';
    }
    if (filterInviteAccepted || filterInviteAccepted2) {
      query.inviteAccepted = (filterInviteAccepted || filterInviteAccepted2) === 'true';
    }
    if (filterPayrollAccess || filterPayrollAccess2) {
      query.payrollAccess = (filterPayrollAccess || filterPayrollAccess2) === 'true';
    }

    // Handle date filters
    if (filterCreated) {
      const date = new Date(filterCreated);
      if (!isNaN(date)) {
        query.createdAt = { $gte: date };
      }
    }
    if (filterHiredAt || filterHiredAt2) {
      const hiredDate = filterHiredAt || filterHiredAt2;
      const date = new Date(hiredDate);
      if (!isNaN(date)) {
        query.hiredAt = { $gte: date };
      }
    }

    // Handle system filters
    if (filterHostName || filterHostName2) {
      query.lastHostName = filterHostName || filterHostName2;
    }
    if (filterOs) {
      query.lastOS = filterOs;
    }
    if (filterIp) {
      query.lastLoginIp = filterIp;
    }
    if (filterClientVersion || filterClientVersion2) {
      query.clientVersion = filterClientVersion || filterClientVersion2;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'id':
        sortObj = { _id: 1 };
        break;
      case 'email':
        sortObj = { email: 1 };
        break;
      case 'name':
        sortObj = { firstName: 1, lastName: 1 };
        break;
      case 'created':
        sortObj = { createdAt: -1 };
        break;
      case 'lastLogin':
        sortObj = { lastLogin: -1 };
        break;
      default:
        sortObj = { _id: 1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const users = await User.find(query, null, {
      sort: sortObj,
      skip: skip,
      limit: limitNum
    });

    const totalUsers = await User.countDocuments(query);

    // Format users based on detail level
    const formattedUsers = users.map(user => {
      const baseUser = {
        id: user._id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: user.fullName,
        role: user.role,
        status: user.status,
        company_id: user.companyId
      };

      // Add additional details based on detail parameter
      if (detail === 'full' || detail === 'extended') {
        return {
          ...baseUser,
          avatar: user.avatar,
          phone: user.phone,
          timezone: user.timezone,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          last_login: user.lastLogin,
          last_login_ip: user.lastLoginIp,
          two_factor_enabled: user.twoFactorEnabled,
          email_verified: user.emailVerified,
          permissions: user.defaultPermissions,
          settings: user.settings,
          
          // Time Doctor specific fields
          show_on_reports: user.showOnReports !== false,
          invite_pending: user.invitePending || false,
          invite_accepted: user.inviteAccepted !== false,
          payroll_access: user.payrollAccess || false,
          hired_at: user.hiredAt,
          last_track: user.lastTrack,
          last_active_track: user.lastActiveTrack,
          client_version: user.clientVersion,
          host_name: user.lastHostName,
          os: user.lastOS,
          screenshots_enabled: user.screenshotsEnabled !== false,
          videos_enabled: user.videosEnabled || false,
          tags: user.tags || [],
          tag_count: (user.tags || []).length
        };
      }

      return baseUser;
    });

    // Build response
    const response = {
      data: formattedUsers,
      meta: {
        total: totalUsers,
        count: formattedUsers.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalUsers / limitNum),
        has_more: pageNum * limitNum < totalUsers
      }
    };

    // Add task-project-names if requested
    if (taskProjectNames === 'true') {
      // This would typically fetch project/task associations
      response.task_project_names = true;
    }

    logger.info(`Retrieved ${formattedUsers.length} users for company ${company || 'all'}`);

    res.json(response);

  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    next(error);
  }
});

// @route   GET /api/1.0/users/me
// @desc    Get current user profile (Time Doctor compatible)
// @access  Private
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found' 
        }
      });
    }

    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: user.fullName,
      role: user.role,
      status: user.status,
      company_id: user.companyId,
      avatar: user.avatar,
      phone: user.phone,
      timezone: user.timezone,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLogin,
      two_factor_enabled: user.twoFactorEnabled,
      email_verified: user.emailVerified,
      permissions: user.defaultPermissions,
      settings: user.settings
    };

    res.json({ data: userData });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/1.0/users/:id
// @desc    Get user by ID (Time Doctor compatible)
// @access  Private
router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found' 
        }
      });
    }

    // Check if user can view this profile
    if (req.user.userId !== user._id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager') {
      return res.status(403).json({ 
        error: {
          code: 403,
          message: 'Access denied' 
        }
      });
    }

    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: user.fullName,
      role: user.role,
      status: user.status,
      company_id: user.companyId,
      avatar: user.avatar,
      phone: user.phone,
      timezone: user.timezone,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      last_login: user.lastLogin,
      two_factor_enabled: user.twoFactorEnabled,
      email_verified: user.emailVerified,
      permissions: user.defaultPermissions,
      
      // Extended user info
      show_on_reports: user.showOnReports !== false,
      invite_pending: user.invitePending || false,
      invite_accepted: user.inviteAccepted !== false,
      payroll_access: user.payrollAccess || false,
      hired_at: user.hiredAt,
      last_track: user.lastTrack,
      last_active_track: user.lastActiveTrack,
      client_version: user.clientVersion,
      host_name: user.lastHostName,
      os: user.lastOS,
      screenshots_enabled: user.screenshotsEnabled !== false,
      videos_enabled: user.videosEnabled || false,
      tags: user.tags || [],
      tag_count: (user.tags || []).length
    };

    res.json({ data: userData });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/1.0/users/:id
// @desc    Update user (Time Doctor compatible)
// @access  Private
router.put('/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found' 
        }
      });
    }

    // Check permissions
    if (req.user.userId !== user._id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager') {
      return res.status(403).json({ 
        error: {
          code: 403,
          message: 'Access denied' 
        }
      });
    }

    const allowedUpdates = [
      'firstName', 'lastName', 'username', 'phone', 'avatar', 
      'timezone', 'settings', 'showOnReports', 'payrollAccess',
      'screenshotsEnabled', 'videosEnabled', 'tags'
    ];

    // Admin can update role and status
    if (req.user.role === 'admin') {
      allowedUpdates.push('role', 'status', 'companyId');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    const userData = updatedUser.getSafeData();

    logger.info(`User ${updatedUser.email} updated by ${req.user.email}`);

    res.json({ 
      message: 'User updated successfully',
      data: userData 
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/1.0/users/:id
// @desc    Delete/deactivate user (Time Doctor compatible)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: {
          code: 403,
          message: 'Admin access required' 
        }
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found' 
        }
      });
    }

    // Soft delete by updating status
    user.status = 'deleted';
    user.deleted = true;
    user.deletedAt = new Date();
    await user.save();

    logger.info(`User ${user.email} deleted by ${req.user.email}`);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/1.0/users/:id/restore
// @desc    Restore deleted user (Time Doctor compatible)
// @access  Private/Admin
router.post('/:id/restore', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: {
          code: 403,
          message: 'Admin access required' 
        }
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: {
          code: 404,
          message: 'User not found' 
        }
      });
    }

    user.status = 'active';
    user.deleted = false;
    user.deletedAt = null;
    await user.save();

    logger.info(`User ${user.email} restored by ${req.user.email}`);

    res.json({
      message: 'User restored successfully',
      data: user.getSafeData()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;