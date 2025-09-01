// In-memory database for testing without MongoDB
const logger = require('../utils/logger');

// In-memory storage
const db = {
  users: [],
  companies: [],
  projects: [],
  tasks: [],
  timeEntries: [],
  screenshots: [],
  activities: []
};

// Helper functions to simulate MongoDB operations
const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const connectDB = async () => {
  try {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('In-Memory Database Connected');
    console.log('✅ In-Memory Database Connected (No MongoDB required)');
    
    // Add some sample data
    if (db.users.length === 0) {
      const sampleUser = {
        _id: generateId(),
        email: 'admin@example.com',
        username: 'admin',
        password: '$2a$10$YourHashedPasswordHere', // In real app, this would be hashed
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      db.users.push(sampleUser);
      logger.info('Sample admin user created: admin@example.com');
    }
    
    return true;
  } catch (error) {
    logger.error('Error setting up in-memory database:', error);
    console.error('❌ Error setting up in-memory database:', error);
    process.exit(1);
  }
};

// Export database and helper functions
module.exports = connectDB;
module.exports.db = db;
module.exports.generateId = generateId;