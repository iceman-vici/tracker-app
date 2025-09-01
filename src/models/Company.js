const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: String,
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },
  website: String,
  logo: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contact: {
    email: String,
    phone: String,
    supportEmail: String
  },
  billing: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'cancelled', 'suspended'],
      default: 'active'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    subscriptionId: String,
    customerId: String,
    paymentMethod: String,
    billingEmail: String,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, default: '12h' },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    weekStartDay: { type: Number, default: 1 }, // 1 = Monday
    fiscalYearStart: { type: Number, default: 1 }, // Month
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    workingDays: [{
      type: Number,
      min: 0,
      max: 6
    }],
    holidays: [{
      date: Date,
      name: String,
      recurring: { type: Boolean, default: false }
    }],
    tracking: {
      screenshotEnabled: { type: Boolean, default: true },
      screenshotInterval: { type: Number, default: 10 }, // minutes
      activityTracking: { type: Boolean, default: true },
      appTracking: { type: Boolean, default: true },
      urlTracking: { type: Boolean, default: true },
      idleTimeout: { type: Number, default: 5 }, // minutes
      requireProjectSelection: { type: Boolean, default: false },
      allowManualTime: { type: Boolean, default: true },
      approvalRequired: { type: Boolean, default: false }
    },
    payroll: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'],
        default: 'monthly'
      },
      payDay: Number, // Day of week/month
      overtimeEnabled: { type: Boolean, default: true },
      overtimeThreshold: { type: Number, default: 40 }, // hours per week
      overtimeMultiplier: { type: Number, default: 1.5 }
    },
    invoicing: {
      enabled: { type: Boolean, default: true },
      prefix: { type: String, default: 'INV' },
      nextNumber: { type: Number, default: 1 },
      dueDays: { type: Number, default: 30 },
      taxRate: { type: Number, default: 0 },
      terms: String,
      notes: String
    }
  },
  limits: {
    maxUsers: { type: Number, default: 5 },
    maxProjects: { type: Number, default: 10 },
    maxStorageGB: { type: Number, default: 10 },
    maxApiCalls: { type: Number, default: 10000 }
  },
  usage: {
    currentUsers: { type: Number, default: 0 },
    currentProjects: { type: Number, default: 0 },
    currentStorageGB: { type: Number, default: 0 },
    currentApiCalls: { type: Number, default: 0 },
    lastResetDate: Date
  },
  integrations: {
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String,
      channel: String,
      notifications: {
        timeTracking: { type: Boolean, default: true },
        projects: { type: Boolean, default: true },
        reports: { type: Boolean, default: false }
      }
    },
    jira: {
      enabled: { type: Boolean, default: false },
      domain: String,
      email: String,
      apiToken: String,
      projectKey: String
    },
    quickbooks: {
      enabled: { type: Boolean, default: false },
      companyId: String,
      accessToken: String,
      refreshToken: String,
      syncEnabled: { type: Boolean, default: false }
    },
    stripe: {
      enabled: { type: Boolean, default: false },
      accountId: String,
      accessToken: String
    }
  },
  features: {
    timeTracking: { type: Boolean, default: true },
    screenshots: { type: Boolean, default: true },
    activityMonitoring: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    tasks: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    payroll: { type: Boolean, default: false },
    invoicing: { type: Boolean, default: true },
    scheduling: { type: Boolean, default: false },
    attendance: { type: Boolean, default: true },
    expenses: { type: Boolean, default: false },
    customFields: { type: Boolean, default: false },
    api: { type: Boolean, default: true },
    webhooks: { type: Boolean, default: false },
    sso: { type: Boolean, default: false },
    audit: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  metadata: {
    createdBy: String,
    lastModifiedBy: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
companySchema.index({ owner: 1 });
companySchema.index({ domain: 1 });
companySchema.index({ status: 1 });
companySchema.index({ 'billing.plan': 1 });

// Virtual for active users count
companySchema.virtual('activeUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { status: 'active' }
});

// Methods
companySchema.methods.checkLimit = function(limitType) {
  const limit = this.limits[`max${limitType}`];
  const usage = this.usage[`current${limitType}`];
  return usage < limit;
};

companySchema.methods.incrementUsage = async function(usageType) {
  this.usage[`current${usageType}`]++;
  await this.save();
};

companySchema.methods.resetMonthlyUsage = async function() {
  this.usage.currentApiCalls = 0;
  this.usage.lastResetDate = new Date();
  await this.save();
};

module.exports = mongoose.model('Company', companySchema);