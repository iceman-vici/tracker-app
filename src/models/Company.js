// In-memory Company model (no MongoDB)
const { db, generateId } = require('../config/database');

class Company {
  constructor(data) {
    this._id = data._id || generateId();
    this.name = data.name;
    this.description = data.description;
    this.logo = data.logo;
    this.website = data.website;
    this.email = data.email;
    this.phone = data.phone;
    this.address = data.address || {};
    this.ownerId = data.ownerId;
    this.subscription = data.subscription || {
      plan: 'free',
      status: 'active',
      maxUsers: 5
    };
    this.settings = data.settings || {
      workingHours: { start: '09:00', end: '18:00' },
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY'
    };
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    const existingIndex = db.companies.findIndex(c => c._id === this._id);
    if (existingIndex >= 0) {
      this.updatedAt = new Date();
      db.companies[existingIndex] = this;
    } else {
      db.companies.push(this);
    }
    return this;
  }

  static async find(query = {}) {
    let companies = [...db.companies];
    if (query.ownerId) {
      companies = companies.filter(c => c.ownerId === query.ownerId);
    }
    return companies.map(c => new Company(c));
  }

  static async findById(id) {
    const company = db.companies.find(c => c._id === id);
    return company ? new Company(company) : null;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const index = db.companies.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    const company = db.companies[index];
    const updated = { ...company, ...updates, updatedAt: new Date() };
    db.companies[index] = updated;
    
    return new Company(updated);
  }

  static async findByIdAndDelete(id) {
    const index = db.companies.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    const company = db.companies[index];
    db.companies.splice(index, 1);
    return new Company(company);
  }

  populate(field) {
    return this;
  }
}

module.exports = Company;