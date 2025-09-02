/**
 * API Configuration
 * Uses Time Doctor Production API
 */

const config = {
  // API endpoint - Production Time Doctor API only
  endpoint: {
    baseURL: 'https://api2.timedoctor.com/api/1.0',
    name: 'Time Doctor Production API',
    requiresAuth: true
  },

  // Credentials from environment variables
  credentials: {
    // Add your Time Doctor credentials here (DO NOT COMMIT!)
    email: process.env.TIMEDOCTOR_EMAIL || '',
    password: process.env.TIMEDOCTOR_PASSWORD || '',
    apiKey: process.env.TIMEDOCTOR_API_KEY || ''
  },

  // API settings
  settings: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    debug: process.env.DEBUG === 'true'
  },

  // Rate limiting (for production API)
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerHour: 1000
  }
};

// Get current API configuration
config.getCurrentEndpoint = function() {
  return this.endpoint;
};

// Get credentials
config.getCredentials = function() {
  return this.credentials;
};

module.exports = config;