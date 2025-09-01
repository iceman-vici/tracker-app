// In-memory Task model (no MongoDB)
const { db, generateId } = require('../config/database');

class Task {
  constructor(data) {
    this._id = data._id || generateId();
    this.title = data.title;
    this.description = data.description;
    this.projectId = data.projectId;
    this.assignedTo = data.assignedTo;
    this.createdBy = data.createdBy;
    this.status = data.status || 'todo';
    this.priority = data.priority || 'medium';
    this.dueDate = data.dueDate;
    this.estimatedHours = data.estimatedHours || 0;
    this.actualHours = data.actualHours || 0;
    this.tags = data.tags || [];
    this.attachments = data.attachments || [];
    this.comments = data.comments || [];
    this.checklist = data.checklist || [];
    this.dependencies = data.dependencies || [];
    this.completedAt = data.completedAt;
    this.completedBy = data.completedBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    const existingIndex = db.tasks.findIndex(t => t._id === this._id);
    if (existingIndex >= 0) {
      this.updatedAt = new Date();
      db.tasks[existingIndex] = this;
    } else {
      db.tasks.push(this);
    }
    return this;
  }

  static async find(query = {}) {
    let tasks = [...db.tasks];
    
    if (query.projectId) {
      tasks = tasks.filter(t => t.projectId === query.projectId);
    }
    if (query.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === query.assignedTo);
    }
    if (query.status) {
      tasks = tasks.filter(t => t.status === query.status);
    }
    if (query.priority) {
      tasks = tasks.filter(t => t.priority === query.priority);
    }
    
    return tasks.map(t => new Task(t));
  }

  static async findById(id) {
    const task = db.tasks.find(t => t._id === id);
    return task ? new Task(task) : null;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const index = db.tasks.findIndex(t => t._id === id);
    if (index === -1) return null;
    
    const task = db.tasks[index];
    const updated = { ...task, ...updates, updatedAt: new Date() };
    db.tasks[index] = updated;
    
    return new Task(updated);
  }

  static async findByIdAndDelete(id) {
    const index = db.tasks.findIndex(t => t._id === id);
    if (index === -1) return null;
    
    const task = db.tasks[index];
    db.tasks.splice(index, 1);
    return new Task(task);
  }

  static async deleteMany(query) {
    if (query.projectId) {
      db.tasks = db.tasks.filter(t => t.projectId !== query.projectId);
    }
    return { deletedCount: db.tasks.length };
  }

  static async countDocuments(query = {}) {
    let tasks = [...db.tasks];
    
    if (query.projectId) {
      tasks = tasks.filter(t => t.projectId === query.projectId);
    }
    if (query.status) {
      tasks = tasks.filter(t => t.status === query.status);
    }
    
    return tasks.length;
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

module.exports = Task;