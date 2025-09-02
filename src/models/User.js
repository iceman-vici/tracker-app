// In-memory User model (no MongoDB)
const { db, generateId } = require('../config/database');

class User {
  constructor(data) {
    this._id = data._id || generateId();
    this.email = data.email;
    this.username = data.username;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'user';
    this.companyId = data.companyId;
    this.managerId = data.managerId; // For manager hierarchy
    this.avatar = data.avatar;
    this.phone = data.phone;
    this.timezone = data.timezone || 'UTC';
    this.status = data.status || 'active';
    this.lastLogin = data.lastLogin;
    this.lastLoginIp = data.lastLoginIp;
    
    // Two-Factor Authentication
    this.twoFactorEnabled = data.twoFactorEnabled || false;
    this.totpSecret = data.totpSecret;
    this.totpCode = data.totpCode; // For demo purposes
    this.backupCodes = data.backupCodes || [];
    
    // Permissions
    this.defaultPermissions = data.defaultPermissions || this.getDefaultPermissionsByRole(data.role);
    this.customPermissions = data.customPermissions || [];
    
    // Time Doctor specific fields
    this.showOnReports = data.showOnReports !== false; // Default true
    this.invitePending = data.invitePending || false;
    this.inviteAccepted = data.inviteAccepted !== false; // Default true for existing users
    this.payrollAccess = data.payrollAccess || false;
    this.screenshotsEnabled = data.screenshotsEnabled !== false; // Default true
    this.videosEnabled = data.videosEnabled || false;
    this.hiredAt = data.hiredAt;
    this.lastTrack = data.lastTrack; // Last time tracking activity
    this.lastActiveTrack = data.lastActiveTrack; // Last active tracking
    this.clientVersion = data.clientVersion; // Time Doctor client version
    this.lastHostName = data.lastHostName; // Computer hostname
    this.lastOS = data.lastOS; // Operating system
    this.tags = data.tags || []; // User tags for organization
    
    // Account settings
    this.settings = data.settings || {
      notifications: {
        email: true,
        push: true,
        desktop: true
      },
      privacy: {
        showEmail: false,
        showPhone: false,
        showActivity: true
      },
      preferences: {
        theme: 'light',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      },
      security: {
        sessionTimeout: 24, // hours
        forceLogoutInactive: false,
        allowMultipleSessions: true
      },
      tracking: {
        autoStart: false,
        idleTimeout: 300, // seconds
        screenshotFrequency: 3, // minutes
        blurScreenshots: false,
        trackKeystrokes: true,
        trackMouseClicks: true,
        trackApplications: true,
        trackWebsites: true
      }
    };
    
    // Verification
    this.emailVerified = data.emailVerified || false;
    this.phoneVerified = data.phoneVerified || false;
    this.verificationToken = data.verificationToken;
    
    // Account management
    this.isLocked = data.isLocked || false;
    this.lockReason = data.lockReason;
    this.failedLoginAttempts = data.failedLoginAttempts || 0;
    this.lastFailedLogin = data.lastFailedLogin;
    this.deleted = data.deleted || false;
    this.deletedAt = data.deletedAt;
    
    // Employment info
    this.employeeId = data.employeeId;
    this.department = data.department;
    this.jobTitle = data.jobTitle;
    this.hourlyRate = data.hourlyRate;
    this.currency = data.currency || 'USD';
    this.workHoursPerDay = data.workHoursPerDay || 8;
    this.workDaysPerWeek = data.workDaysPerWeek || 5;
    
    // Productivity tracking
    this.productivityGoal = data.productivityGoal || 80; // Percentage
    this.billableHours = data.billableHours || 0;
    this.totalHoursWorked = data.totalHoursWorked || 0;
    this.averageProductivity = data.averageProductivity || 0;
    
    // Timestamps
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Get default permissions based on role
  getDefaultPermissionsByRole(role) {
    const rolePermissions = {
      'user': 'read',
      'manager': 'write', 
      'admin': 'admin',
      'super_admin': 'admin'
    };
    return rolePermissions[role] || 'read';
  }

  // Save user to database
  async save() {
    const existingIndex = db.users.findIndex(u => u._id === this._id);
    if (existingIndex >= 0) {
      this.updatedAt = new Date();
      db.users[existingIndex] = this;
    } else {
      db.users.push(this);
    }
    return this;
  }

  // Find user by ID
  static async findById(id) {
    const user = db.users.find(u => u._id === id);
    return user ? new User(user) : null;
  }

  // Find user by email
  static async findOne(query) {
    let user = null;
    if (query.email) {
      user = db.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
    } else if (query.username) {
      user = db.users.find(u => u.username === query.username);
    } else if (query.verificationToken) {
      user = db.users.find(u => u.verificationToken === query.verificationToken);
    } else if (query.employeeId) {
      user = db.users.find(u => u.employeeId === query.employeeId);
    } else if (query.$or) {
      // Handle $or queries
      user = db.users.find(u => {
        return query.$or.some(condition => {
          if (condition.email) return u.email.toLowerCase() === condition.email.toLowerCase();
          if (condition.username) return u.username === condition.username;
          return false;
        });
      });
    }
    return user ? new User(user) : null;
  }

  // Find all users with pagination and filtering
  static async find(query = {}, projection = null, options = {}) {
    let users = [...db.users];
    
    // Apply filters
    if (query._id) {
      if (typeof query._id === 'string') {
        users = users.filter(u => u._id === query._id);
      } else if (query._id.$ne) {
        users = users.filter(u => u._id !== query._id.$ne);
      }
    }
    
    if (query.companyId) {
      users = users.filter(u => u.companyId === query.companyId);
    }
    if (query.managerId) {
      users = users.filter(u => u.managerId === query.managerId);
    }
    if (query.role) {
      users = users.filter(u => u.role === query.role);
    }
    if (query.status) {
      if (typeof query.status === 'string') {
        users = users.filter(u => u.status === query.status);
      } else if (query.status.$ne) {
        users = users.filter(u => u.status !== query.status.$ne);
      }
    }
    if (query.deleted) {
      if (typeof query.deleted === 'boolean') {
        users = users.filter(u => u.deleted === query.deleted);
      } else if (query.deleted.$ne) {
        users = users.filter(u => u.deleted !== query.deleted.$ne);
      }
    }
    if (query.twoFactorEnabled !== undefined) {
      users = users.filter(u => u.twoFactorEnabled === query.twoFactorEnabled);
    }
    if (query.emailVerified !== undefined) {
      users = users.filter(u => u.emailVerified === query.emailVerified);
    }
    if (query.showOnReports !== undefined) {
      users = users.filter(u => u.showOnReports === query.showOnReports);
    }
    if (query.payrollAccess !== undefined) {
      users = users.filter(u => u.payrollAccess === query.payrollAccess);
    }
    if (query.invitePending !== undefined) {
      users = users.filter(u => u.invitePending === query.invitePending);
    }
    
    // Handle date filters
    if (query.createdAt) {
      if (query.createdAt.$gte) {
        users = users.filter(u => new Date(u.createdAt) >= new Date(query.createdAt.$gte));
      }
      if (query.createdAt.$lte) {
        users = users.filter(u => new Date(u.createdAt) <= new Date(query.createdAt.$lte));
      }
    }
    if (query.hiredAt) {
      if (query.hiredAt.$gte) {
        users = users.filter(u => u.hiredAt && new Date(u.hiredAt) >= new Date(query.hiredAt.$gte));
      }
    }
    
    // Handle text search queries
    if (query.$or) {
      users = users.filter(u => {
        return query.$or.some(condition => {
          for (const [field, value] of Object.entries(condition)) {
            if (typeof value === 'object' && value.$regex) {
              const regex = new RegExp(value.$regex, value.$options || '');
              return regex.test(u[field] || '');
            }
            if (u[field] === value) return true;
          }
          return false;
        });
      });
    }
    
    // Handle complex queries
    if (query.email && typeof query.email === 'object' && query.email.$regex) {
      const regex = new RegExp(query.email.$regex, query.email.$options || '');
      users = users.filter(u => regex.test(u.email || ''));
    }
    
    // Apply sorting
    if (options.sort) {
      const sortEntries = Object.entries(options.sort);
      users.sort((a, b) => {
        for (const [field, order] of sortEntries) {
          let aVal = a[field];
          let bVal = b[field];
          
          // Handle nested fields like firstName, lastName
          if (field === 'firstName' || field === 'lastName') {
            aVal = a[field] || '';
            bVal = b[field] || '';
          }
          
          if (aVal < bVal) return order === 1 ? -1 : 1;
          if (aVal > bVal) return order === 1 ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Apply pagination
    if (options.skip) {
      users = users.slice(options.skip);
    }
    if (options.limit) {
      users = users.slice(0, options.limit);
    }
    
    return users.map(u => new User(u));
  }

  // Update user
  static async findByIdAndUpdate(id, updates, options = {}) {
    const userIndex = db.users.findIndex(u => u._id === id);
    if (userIndex === -1) return null;
    
    const user = db.users[userIndex];
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    db.users[userIndex] = updatedUser;
    
    if (options.new) {
      return new User(updatedUser);
    }
    return new User(user); // Return original user
  }

  // Delete user
  static async findByIdAndDelete(id) {
    const userIndex = db.users.findIndex(u => u._id === id);
    if (userIndex === -1) return null;
    
    const user = db.users[userIndex];
    db.users.splice(userIndex, 1);
    return new User(user);
  }

  // Count documents
  static async countDocuments(query = {}) {
    let users = [...db.users];
    
    // Apply same filters as find method
    if (query.companyId) {
      users = users.filter(u => u.companyId === query.companyId);
    }
    if (query.role) {
      users = users.filter(u => u.role === query.role);
    }
    if (query.status) {
      if (typeof query.status === 'string') {
        users = users.filter(u => u.status === query.status);
      } else if (query.status.$ne) {
        users = users.filter(u => u.status !== query.status.$ne);
      }
    }
    if (query.deleted) {
      if (typeof query.deleted === 'boolean') {
        users = users.filter(u => u.deleted === query.deleted);
      } else if (query.deleted.$ne) {
        users = users.filter(u => u.deleted !== query.deleted.$ne);
      }
    }
    
    // Handle $or queries for counting
    if (query.$or) {
      users = users.filter(u => {
        return query.$or.some(condition => {
          for (const [field, value] of Object.entries(condition)) {
            if (typeof value === 'object' && value.$regex) {
              const regex = new RegExp(value.$regex, value.$options || '');
              return regex.test(u[field] || '');
            }
            if (u[field] === value) return true;
          }
          return false;
        });
      });
    }
    
    return users.length;
  }

  // Aggregate function (basic implementation)
  static async aggregate(pipeline) {
    let users = [...db.users];
    
    // Basic implementation of aggregation pipeline
    for (const stage of pipeline) {
      if (stage.$match) {
        const match = stage.$match;
        users = users.filter(u => {
          for (const [key, value] of Object.entries(match)) {
            if (u[key] !== value) return false;
          }
          return true;
        });
      }
      
      if (stage.$group) {
        // Basic grouping implementation
        const group = stage.$group;
        const groupedData = {};
        
        for (const user of users) {
          const key = group._id === null ? 'all' : user[group._id.replace('$', '')];
          if (!groupedData[key]) {
            groupedData[key] = { _id: key };
          }
          
          // Handle count
          if (group.count) {
            groupedData[key].count = (groupedData[key].count || 0) + 1;
          }
        }
        
        users = Object.values(groupedData);
      }
    }
    
    return users;
  }

  // Virtual property for full name
  get fullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  // Method to check if user has specific permission
  hasPermission(permission) {
    const permissions = ['read', 'write', 'admin'];
    const userPermissionLevel = permissions.indexOf(this.defaultPermissions);
    const requiredPermissionLevel = permissions.indexOf(permission);
    
    return userPermissionLevel >= requiredPermissionLevel;
  }

  // Method to check if user can access resource
  canAccess(resource, action) {
    const permissions = {
      user: {
        read: ['own_profile', 'own_tasks', 'own_time_entries'],
        write: ['own_profile', 'own_tasks', 'own_time_entries'],
        delete: ['own_time_entries']
      },
      manager: {
        read: ['all_profiles', 'all_tasks', 'all_time_entries', 'reports'],
        write: ['all_tasks', 'reports'],
        delete: ['tasks', 'time_entries']
      },
      admin: {
        read: ['*'],
        write: ['*'],
        delete: ['*']
      },
      super_admin: {
        read: ['*'],
        write: ['*'],
        delete: ['*']
      }
    };

    const userPermissions = permissions[this.role];
    if (!userPermissions) return false;
    
    const actionPermissions = userPermissions[action];
    if (!actionPermissions) return false;
    
    return actionPermissions.includes('*') || actionPermissions.includes(resource);
  }

  // Get safe user data (without sensitive information)
  getSafeData() {
    return {
      id: this._id,
      email: this.email,
      username: this.username,
      first_name: this.firstName,
      last_name: this.lastName,
      full_name: this.fullName,
      role: this.role,
      company_id: this.companyId,
      manager_id: this.managerId,
      status: this.status,
      timezone: this.timezone,
      avatar: this.avatar,
      phone: this.phone,
      lastLogin: this.lastLogin,
      twoFactorEnabled: this.twoFactorEnabled,
      emailVerified: this.emailVerified,
      permissions: this.defaultPermissions,
      
      // Time Doctor specific fields
      show_on_reports: this.showOnReports,
      invite_pending: this.invitePending,
      invite_accepted: this.inviteAccepted,
      payroll_access: this.payrollAccess,
      screenshots_enabled: this.screenshotsEnabled,
      videos_enabled: this.videosEnabled,
      hired_at: this.hiredAt,
      last_track: this.lastTrack,
      last_active_track: this.lastActiveTrack,
      client_version: this.clientVersion,
      host_name: this.lastHostName,
      os: this.lastOS,
      tags: this.tags,
      tag_count: (this.tags || []).length,
      
      // Employment info
      employee_id: this.employeeId,
      department: this.department,
      job_title: this.jobTitle,
      hourly_rate: this.hourlyRate,
      currency: this.currency,
      work_hours_per_day: this.workHoursPerDay,
      
      // Productivity
      productivity_goal: this.productivityGoal,
      average_productivity: this.averageProductivity,
      total_hours_worked: this.totalHoursWorked,
      billable_hours: this.billableHours,
      
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Convert to JSON (for API responses)
  toJSON() {
    const user = { ...this };
    delete user.password;
    delete user.totpSecret;
    delete user.verificationToken;
    delete user.backupCodes;
    return user;
  }
}

module.exports = User;