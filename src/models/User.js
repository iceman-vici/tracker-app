const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'manager', 'admin', 'super_admin'],
    default: 'user'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  avatar: {
    type: String
  },
  phone: {
    type: String
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showActivity: { type: Boolean, default: true }
    },
    preferences: {
      theme: { type: String, default: 'light' },
      language: { type: String, default: 'en' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, default: '12h' }
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ companyId: 1 });
userSchema.index({ status: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if user can access resource
userSchema.methods.canAccess = function(resource, action) {
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
};

module.exports = mongoose.model('User', userSchema);