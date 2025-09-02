/**
 * API Configuration
 * Switch between local development server and production Time Doctor API
 */

const config = {
  // Environment: 'local' or 'production'
  environment: process.env.API_ENV || 'local',

  // API endpoints
  endpoints: {
    local: {
      baseURL: 'http://localhost:3000/api/1.0',
      name: 'Local Development Server',
      requiresAuth: true
    },
    production: {
      baseURL: 'https://api2.timedoctor.com/api/1.0',
      name: 'Time Doctor Production API',
      requiresAuth: true
    }
  },

  // Default credentials for local testing
  testCredentials: {
    local: {
      email: 'admin@example.com',
      password: 'password123'
    },
    production: {
      // Add your Time Doctor credentials here (DO NOT COMMIT!)
      email: process.env.TIMEDOCTOR_EMAIL || '',
      password: process.env.TIMEDOCTOR_PASSWORD || ''
    }
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
  return this.endpoints[this.environment];
};

// Get current test credentials
config.getTestCredentials = function() {
  return this.testCredentials[this.environment];
};

// Switch environment
config.setEnvironment = function(env) {
  if (this.endpoints[env]) {
    this.environment = env;
    console.log(`Switched to ${env} environment:`, this.endpoints[env].name);
  } else {
    throw new Error(`Invalid environment: ${env}`);
  }
};

module.exports = config;