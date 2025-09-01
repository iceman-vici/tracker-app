// In-memory Project model (no MongoDB)
const { db, generateId } = require('../config/database');

class Project {
  constructor(data) {
    this._id = data._id || generateId();
    this.name = data.name;
    this.description = data.description;
    this.companyId = data.companyId;
    this.clientId = data.clientId;
    this.managerId = data.managerId;
    this.teamMembers = data.teamMembers || [];
    this.status = data.status || 'planning';
    this.priority = data.priority || 'medium';
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.budget = data.budget || {};
    this.billing = data.billing || {};
    this.progress = data.progress || 0;
    this.tags = data.tags || [];
    this.attachments = data.attachments || [];
    this.settings = data.settings || {
      visibility: 'team',
      allowComments: true,
      requireTimeApproval: false,
      sendDailyReports: false
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    const existingIndex = db.projects.findIndex(p => p._id === this._id);
    if (existingIndex >= 0) {
      this.updatedAt = new Date();
      db.projects[existingIndex] = this;
    } else {
      db.projects.push(this);
    }
    return this;
  }

  static async find(query = {}) {
    let projects = [...db.projects];
    
    if (query.companyId) {
      projects = projects.filter(p => p.companyId === query.companyId);
    }
    if (query.status) {
      projects = projects.filter(p => p.status === query.status);
    }
    if (query.priority) {
      projects = projects.filter(p => p.priority === query.priority);
    }
    
    return projects.map(p => new Project(p));
  }

  static async findById(id) {
    const project = db.projects.find(p => p._id === id);
    return project ? new Project(project) : null;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const index = db.projects.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    const project = db.projects[index];
    const updated = { ...project, ...updates, updatedAt: new Date() };
    db.projects[index] = updated;
    
    return new Project(updated);
  }

  static async findByIdAndDelete(id) {
    const index = db.projects.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    const project = db.projects[index];
    db.projects.splice(index, 1);
    return new Project(project);
  }

  static async countDocuments(query = {}) {
    let projects = [...db.projects];
    
    if (query.companyId) {
      projects = projects.filter(p => p.companyId === query.companyId);
    }
    if (query.status) {
      projects = projects.filter(p => p.status === query.status);
    }
    
    return projects.length;
  }

  populate(field) {
    return this;
  }

  limit(n) {
    return this;
  }

  skip(n) {
    return this;
  }

  sort(criteria) {
    return this;
  }
}

module.exports = Project;