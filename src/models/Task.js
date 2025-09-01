const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['task', 'bug', 'feature', 'improvement', 'epic'],
    default: 'task'
  },
  estimatedHours: Number,
  actualHours: { type: Number, default: 0 },
  dueDate: Date,
  startDate: Date,
  completedDate: Date,
  tags: [String],
  labels: [{
    name: String,
    color: String
  }],
  dependencies: [{
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by', 'related-to'],
      default: 'related-to'
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
  comments: [{
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    editedAt: Date,
    attachments: [{
      name: String,
      url: String
    }]
  }],
  checklist: [{
    item: String,
    completed: { type: Boolean, default: false },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date
  }],
  customFields: [{
    fieldId: String,
    name: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'select', 'multiselect']
    }
  }],
  timeTracking: {
    estimate: Number, // in hours
    spent: { type: Number, default: 0 }, // in hours
    remaining: Number // in hours
  },
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date,
    nextOccurrence: Date
  },
  notifications: {
    onAssignment: { type: Boolean, default: true },
    onDueDate: { type: Boolean, default: true },
    onComment: { type: Boolean, default: true },
    onStatusChange: { type: Boolean, default: true },
    reminderBefore: Number // hours before due date
  },
  workflow: {
    currentStep: String,
    steps: [{
      name: String,
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'skipped']
      },
      completedAt: Date,
      notes: String
    }]
  },
  integrations: {
    jira: {
      issueKey: String,
      issueId: String,
      syncEnabled: { type: Boolean, default: false },
      lastSync: Date
    },
    github: {
      issueNumber: Number,
      pullRequest: String,
      syncEnabled: { type: Boolean, default: false },
      lastSync: Date
    }
  },
  metadata: {
    views: { type: Number, default: 0 },
    lastViewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastViewedAt: Date,
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    source: {
      type: String,
      enum: ['manual', 'import', 'integration', 'template'],
      default: 'manual'
    }
  },
  archived: {
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ company: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ tags: 1 });

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (!this.checklist || this.checklist.length === 0) {
    return this.status === 'done' ? 100 : 0;
  }
  
  const completed = this.checklist.filter(item => item.completed).length;
  return Math.round((completed / this.checklist.length) * 100);
});

// Virtual for is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'done' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Methods
taskSchema.methods.addComment = async function(userId, text, attachments = []) {
  this.comments.push({
    author: userId,
    text,
    attachments,
    createdAt: new Date()
  });
  await this.save();
  return this;
};

taskSchema.methods.updateProgress = async function() {
  // Update time tracking spent hours from TimeEntry model
  const TimeEntry = mongoose.model('TimeEntry');
  const entries = await TimeEntry.aggregate([
    { $match: { task: this._id, status: 'stopped' } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  
  if (entries.length > 0) {
    this.timeTracking.spent = entries[0].total / 3600; // Convert seconds to hours
    this.actualHours = this.timeTracking.spent;
    
    if (this.timeTracking.estimate) {
      this.timeTracking.remaining = Math.max(0, this.timeTracking.estimate - this.timeTracking.spent);
    }
  }
  
  await this.save();
  return this;
};

taskSchema.methods.complete = async function(userId) {
  this.status = 'done';
  this.completedDate = new Date();
  this.metadata.lastModifiedBy = userId;
  await this.save();
  return this;
};

taskSchema.methods.assign = async function(userId) {
  if (!this.assignedTo.includes(userId)) {
    this.assignedTo.push(userId);
    await this.save();
  }
  return this;
};

taskSchema.methods.unassign = async function(userId) {
  this.assignedTo = this.assignedTo.filter(id => !id.equals(userId));
  await this.save();
  return this;
};

module.exports = mongoose.model('Task', taskSchema);