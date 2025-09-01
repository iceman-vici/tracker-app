const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
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
    enum: ['owner', 'admin', 'manager', 'employee'],
    default: 'employee'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  department: String,
  position: String,
  employeeId: String,
  phoneNumber: String,
  avatar: String,
  timezone: {
    type: String,
    default: 'UTC'
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  overtimeRate: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
    breakDuration: { type: Number, default: 60 } // in minutes
  },
  workingDays: [{
    type: Number,
    min: 0,
    max: 6
  }],
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    desktop: { type: Boolean, default: true },
    timeTracking: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    payroll: { type: Boolean, default: true }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    lastPasswordChange: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  tracking: {
    screenshotInterval: { type: Number, default: 10 }, // minutes
    activityLevel: { type: String, default: 'normal' }, // low, normal, high
    idleTimeout: { type: Number, default: 5 }, // minutes
    trackApps: { type: Boolean, default: true },
    trackUrls: { type: Boolean, default: true },
    blurScreenshots: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  lastActive: Date,
  tokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now }
  }],
  integrations: {
    slack: {
      connected: { type: Boolean, default: false },
      userId: String,
      accessToken: String
    },
    google: {
      connected: { type: Boolean, default: false },
      userId: String,
      accessToken: String,
      refreshToken: String
    },
    jira: {
      connected: { type: Boolean, default: false },
      email: String,
      apiToken: String,
      domain: String
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    accountLockedUntil: Date
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1, company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.lastPasswordChange = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  
  this.tokens = this.tokens.concat({ token });
  await this.save();
  
  return token;
};

// Generate refresh token
userSchema.methods.generateRefreshToken = async function() {
  const token = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
  
  this.refreshTokens = this.refreshTokens.concat({ token });
  await this.save();
  
  return token;
};

// Clean expired tokens
userSchema.methods.cleanExpiredTokens = async function() {
  const now = Date.now();
  const tokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  this.tokens = this.tokens.filter(tokenObj => {
    return now - tokenObj.createdAt.getTime() < tokenExpiry;
  });
  
  await this.save();
};

// toJSON method to remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.tokens;
  delete user.refreshTokens;
  delete user.security.twoFactorSecret;
  delete user.security.passwordResetToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);