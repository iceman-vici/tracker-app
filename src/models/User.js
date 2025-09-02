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
  static async find(query = {}, options = {}) {
    let users = [...db.users];
    
    // Apply filters
    if (query.companyId) {
      users = users.filter(u => u.companyId === query.companyId);
    }
    if (query.role) {
      users = users.filter(u => u.role === query.role);
    }
    if (query.status) {
      users = users.filter(u => u.status === query.status);
    }
    if (query.twoFactorEnabled !== undefined) {
      users = users.filter(u => u.twoFactorEnabled === query.twoFactorEnabled);
    }
    if (query.emailVerified !== undefined) {
      users = users.filter(u => u.emailVerified === query.emailVerified);
    }
    
    // Apply sorting
    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField];
      users.sort((a, b) => {
        if (sortOrder === 1) {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
        }
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
    
    if (query.companyId) {
      users = users.filter(u => u.companyId === query.companyId);
    }
    if (query.role) {
      users = users.filter(u => u.role === query.role);
    }
    if (query.status) {
      users = users.filter(u => u.status === query.status);
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

  // Select specific fields (simulated)
  select(fields) {
    if (typeof fields === 'string') {
      const fieldsArray = fields.split(' ');
      const result = {};
      
      for (const field of fieldsArray) {
        if (field.startsWith('-')) {
          // Exclude field
          const fieldName = field.substring(1);
          if (fieldName !== 'password' || !field.includes('-password')) {
            result[fieldName] = this[fieldName];
          }
        } else {
          // Include field
          result[field] = this[field];
        }
      }
      
      return result;
    }
    
    if (fields.includes('-password')) {
      delete this.password;
    }
    return this;
  }

  // Populate references (simulated)
  populate(field) {
    // In a real implementation, this would fetch related data
    return this;
  }

  // Virtual property for full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
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

  // Method to lock user account
  async lockAccount(reason) {
    this.isLocked = true;
    this.lockReason = reason;
    this.status = 'locked';
    return await this.save();
  }

  // Method to unlock user account
  async unlockAccount() {
    this.isLocked = false;
    this.lockReason = null;
    this.status = 'active';
    this.failedLoginAttempts = 0;
    this.lastFailedLogin = null;
    return await this.save();
  }

  // Method to increment failed login attempts
  async incrementFailedLogin() {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    this.lastFailedLogin = new Date();
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      await this.lockAccount('Too many failed login attempts');
    } else {
      await this.save();
    }
    
    return this;
  }

  // Method to reset failed login attempts
  async resetFailedLoginAttempts() {
    this.failedLoginAttempts = 0;
    this.lastFailedLogin = null;
    return await this.save();
  }

  // Method to enable 2FA
  async enable2FA(secret) {
    this.twoFactorEnabled = true;
    this.totpSecret = secret;
    return await this.save();
  }

  // Method to disable 2FA
  async disable2FA() {
    this.twoFactorEnabled = false;
    this.totpSecret = null;
    this.backupCodes = [];
    return await this.save();
  }

  // Method to generate backup codes
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
    this.backupCodes = codes;
    return codes;
  }

  // Method to use backup code
  useBackupCode(code) {
    const index = this.backupCodes.indexOf(code);
    if (index > -1) {
      this.backupCodes.splice(index, 1);
      return true;
    }
    return false;
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

  // Get safe user data (without sensitive information)
  getSafeData() {
    return {
      id: this._id,
      email: this.email,
      username: this.username,
      first_name: this.firstName,
      last_name: this.lastName,
      role: this.role,
      company_id: this.companyId,
      status: this.status,
      timezone: this.timezone,
      avatar: this.avatar,
      lastLogin: this.lastLogin,
      twoFactorEnabled: this.twoFactorEnabled,
      emailVerified: this.emailVerified,
      permissions: this.defaultPermissions,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}

module.exports = User;