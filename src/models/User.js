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
      }
    };
    this.emailVerified = data.emailVerified || false;
    this.twoFactorEnabled = data.twoFactorEnabled || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
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

  // Find all users
  static async find(query = {}) {
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
    
    return users.map(u => new User(u));
  }

  // Update user
  static async findByIdAndUpdate(id, updates, options = {}) {
    const userIndex = db.users.findIndex(u => u._id === id);
    if (userIndex === -1) return null;
    
    const user = db.users[userIndex];
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    db.users[userIndex] = updatedUser;
    
    return new User(updatedUser);
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
    
    return users.length;
  }

  // Select specific fields (simulated)
  select(fields) {
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
    return `${this.firstName} ${this.lastName}`;
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
}

module.exports = User;