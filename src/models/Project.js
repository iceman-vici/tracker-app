const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' }
  },
  billing: {
    rate: Number,
    type: { type: String, enum: ['project', 'hourly', 'milestone'], default: 'project' }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  settings: {
    visibility: { type: String, enum: ['public', 'private', 'team'], default: 'team' },
    allowComments: { type: Boolean, default: true },
    requireTimeApproval: { type: Boolean, default: false },
    sendDailyReports: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ companyId: 1 });
projectSchema.index({ managerId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Project', projectSchema);