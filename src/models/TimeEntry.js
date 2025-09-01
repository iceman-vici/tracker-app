const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // in seconds
  description: String,
  tags: [String],
  billable: {
    type: Boolean,
    default: true
  },
  rate: Number,
  status: {
    type: String,
    enum: ['running', 'stopped', 'paused'],
    default: 'running'
  },
  manual: {
    type: Boolean,
    default: false
  },
  approved: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    at: Date,
    notes: String
  },
  activity: {
    keyboard: { type: Number, default: 0 },
    mouse: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    level: {
      type: String,
      enum: ['idle', 'low', 'medium', 'high'],
      default: 'medium'
    }
  },
  screenshots: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screenshot'
  }],
  apps: [{
    name: String,
    duration: Number, // seconds
    category: String
  }],
  urls: [{
    domain: String,
    url: String,
    title: String,
    duration: Number // seconds
  }],
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // seconds
    type: {
      type: String,
      enum: ['short', 'lunch', 'other'],
      default: 'short'
    }
  }],
  location: {
    ip: String,
    country: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  device: {
    type: String,
    os: String,
    browser: String,
    version: String
  },
  edited: {
    isEdited: { type: Boolean, default: false },
    originalDuration: Number,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: Date,
    reason: String
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  metadata: {
    source: {
      type: String,
      enum: ['desktop', 'mobile', 'web', 'api', 'manual'],
      default: 'web'
    },
    version: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ company: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
timeEntrySchema.index({ status: 1 });
timeEntrySchema.index({ 'approved.status': 1 });

// Pre-save middleware to calculate duration
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Methods
timeEntrySchema.methods.stop = async function() {
  this.endTime = new Date();
  this.status = 'stopped';
  this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  await this.save();
  return this;
};

timeEntrySchema.methods.pause = async function() {
  this.status = 'paused';
  const pauseStart = new Date();
  this.breaks.push({
    startTime: pauseStart,
    type: 'short'
  });
  await this.save();
  return this;
};

timeEntrySchema.methods.resume = async function() {
  this.status = 'running';
  const lastBreak = this.breaks[this.breaks.length - 1];
  if (lastBreak && !lastBreak.endTime) {
    lastBreak.endTime = new Date();
    lastBreak.duration = Math.floor((lastBreak.endTime - lastBreak.startTime) / 1000);
  }
  await this.save();
  return this;
};

timeEntrySchema.methods.calculateActivityLevel = function() {
  const totalActivity = this.activity.keyboard + this.activity.mouse;
  const durationMinutes = this.duration / 60;
  const activityPerMinute = totalActivity / durationMinutes;
  
  if (activityPerMinute < 10) return 'idle';
  if (activityPerMinute < 50) return 'low';
  if (activityPerMinute < 150) return 'medium';
  return 'high';
};

timeEntrySchema.methods.getTotalAmount = function() {
  if (!this.billable || !this.rate) return 0;
  const hours = this.duration / 3600;
  return hours * this.rate;
};

// Virtual for formatted duration
timeEntrySchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '00:00:00';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);