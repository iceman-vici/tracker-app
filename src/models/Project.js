const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    hourlyRate: Number,
    allocation: Number, // percentage
    joinedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['fixed', 'hourly', 'retainer', 'non-billable'],
    default: 'hourly'
  },
  budget: {
    type: Number,
    amount: Number,
    currency: { type: String, default: 'USD' },
    alertThreshold: { type: Number, default: 80 } // percentage
  },
  hourlyRate: Number,
  estimatedHours: Number,
  dates: {
    startDate: Date,
    endDate: Date,
    actualStartDate: Date,
    actualEndDate: Date
  },
  billing: {
    method: {
      type: String,
      enum: ['hourly', 'fixed', 'milestone'],
      default: 'hourly'
    },
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'upon-completion'],
      default: 'monthly'
    },
    invoiceSchedule: [{
      date: Date,
      amount: Number,
      status: {
        type: String,
        enum: ['scheduled', 'sent', 'paid'],
        default: 'scheduled'
      }
    }]
  },
  milestones: [{
    name: String,
    description: String,
    dueDate: Date,
    completedDate: Date,
    deliverables: [String],
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'approved'],
      default: 'pending'
    }
  }],
  tags: [String],
  color: {
    type: String,
    default: '#3498db'
  },
  settings: {
    trackTime: { type: Boolean, default: true },
    requireTaskSelection: { type: Boolean, default: false },
    requireDescription: { type: Boolean, default: false },
    screenshotsEnabled: { type: Boolean, default: true },
    activityTrackingEnabled: { type: Boolean, default: true },
    approvalRequired: { type: Boolean, default: false },
    allowManualTime: { type: Boolean, default: true },
    billableByDefault: { type: Boolean, default: true },
    notifyOnBudgetThreshold: { type: Boolean, default: true }
  },
  permissions: {
    public: { type: Boolean, default: false },
    viewTime: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    editTime: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    manageProject: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  stats: {
    totalHours: { type: Number, default: 0 },
    billableHours: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    invoicedAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    tasksTotal: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    overdueTasks: { type: Number, default: 0 },
    lastActivity: Date
  },
  integrations: {
    jira: {
      connected: { type: Boolean, default: false },
      projectKey: String,
      syncEnabled: { type: Boolean, default: false }
    },
    github: {
      connected: { type: Boolean, default: false },
      repository: String,
      syncEnabled: { type: Boolean, default: false }
    },
    slack: {
      connected: { type: Boolean, default: false },
      channel: String,
      notificationsEnabled: { type: Boolean, default: false }
    }
  },
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect']
    }
  }],
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    archived: { type: Boolean, default: false },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ company: 1, status: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ 'teamMembers.user': 1 });
projectSchema.index({ tags: 1 });

// Virtual for progress percentage
projectSchema.virtual('progress').get(function() {
  if (this.stats.tasksTotal === 0) return 0;
  return Math.round((this.stats.tasksCompleted / this.stats.tasksTotal) * 100);
});

// Virtual for budget usage percentage
projectSchema.virtual('budgetUsage').get(function() {
  if (!this.budget || this.budget === 0) return 0;
  return Math.round((this.stats.totalAmount / this.budget) * 100);
});

// Methods
projectSchema.methods.addTeamMember = async function(userId, role, hourlyRate) {
  const exists = this.teamMembers.some(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!exists) {
    this.teamMembers.push({
      user: userId,
      role,
      hourlyRate,
      joinedAt: new Date()
    });
    await this.save();
  }
  return this;
};

projectSchema.methods.removeTeamMember = async function(userId) {
  this.teamMembers = this.teamMembers.filter(member => 
    member.user.toString() !== userId.toString()
  );
  await this.save();
  return this;
};

projectSchema.methods.updateStats = async function() {
  // This would typically aggregate data from TimeEntry model
  // Implementation depends on your specific requirements
  await this.save();
  return this;
};

projectSchema.methods.checkBudgetAlert = function() {
  if (!this.budget || !this.budget.alertThreshold) return false;
  
  const usagePercentage = (this.stats.totalAmount / this.budget.amount) * 100;
  return usagePercentage >= this.budget.alertThreshold;
};

module.exports = mongoose.model('Project', projectSchema);