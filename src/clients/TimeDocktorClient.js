const axios = require('axios');

/**
 * Time Doctor API Client
 * Connects to the official Time Doctor API at https://api2.timedoctor.com/api/1.0
 * Updated to match actual Time Doctor API requirements
 */
class TimeDocktorClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api2.timedoctor.com/api/1.0';
    this.token = config.token || null;
    this.companyId = config.companyId || null;
    this.userId = config.userId || null;
    this.debug = config.debug || false;
  }

  /**
   * Log debug messages
   */
  log(...args) {
    if (this.debug) {
      console.log('[TimeDoctor API]', ...args);
    }
  }

  /**
   * Make API request
   */
  async request(method, endpoint, data = null, params = null) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // For login endpoint, don't add authorization header
    if (this.token && endpoint !== '/login') {
      // Use Bearer token for authenticated requests
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    this.log(`${method} ${url}`, params || data || '');
    if (this.token && endpoint !== '/login') {
      this.log('Using Bearer token:', `Bearer ${this.token.substring(0, 20)}...`);
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        this.log('Error:', error.response.status, error.response.data);
        throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        this.log('Error:', error.message);
        throw error;
      }
    }
  }

  // ==================== Authentication ====================

  /**
   * Login to Time Doctor
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} totpCode - Optional TOTP code for 2FA (leave empty string if not using 2FA)
   * @param {string} permissions - Optional permissions scope (default: 'write')
   * @returns {Promise<Object>} Login response with token
   */
  async login(email, password, totpCode = '', permissions = 'write') {
    const loginData = {
      email,
      password
    };
    
    // Only add totpCode if it's provided and not empty
    if (totpCode && totpCode !== '') {
      loginData.totpCode = totpCode;
    } else {
      // Time Doctor API might expect this field even if empty
      loginData.totpCode = '';
    }
    
    // Add permissions if specified
    if (permissions) {
      loginData.permissions = permissions;
    }
    
    this.log('Login attempt with:', { email, hasPassword: !!password, hasTotpCode: !!totpCode });
    
    const response = await this.request('POST', '/login', loginData);
    
    // Debug: Log the entire response structure
    this.log('Login response structure:', JSON.stringify(response, null, 2));
    
    // Extract token from the response
    let token = null;
    let tokenData = response;
    
    // Check if response has a data wrapper
    if (response.data) {
      tokenData = response.data;
    }
    
    // Try to find the token in various possible locations
    if (tokenData.token) {
      token = tokenData.token;
    } else if (tokenData.access_token) {
      token = tokenData.access_token;
    } else if (tokenData.accessToken) {
      token = tokenData.accessToken;
    } else if (tokenData.authToken) {
      token = tokenData.authToken;
    } else if (typeof tokenData === 'string') {
      // Sometimes the token might be returned as a plain string
      token = tokenData;
    }
    
    if (token) {
      this.token = token;
      this.log('Login successful, token saved:', token.substring(0, 20) + '...');
      
      // Store additional info if available
      if (tokenData.expireAt || tokenData.expiresAt) {
        this.tokenExpiry = tokenData.expireAt || tokenData.expiresAt;
        this.log('Token expires at:', this.tokenExpiry);
      }
      
      if (tokenData.createdAt) {
        this.log('Token created at:', tokenData.createdAt);
      }
      
      // Extract company ID from various possible locations
      if (tokenData.company || tokenData.companyId || tokenData.company_id) {
        this.companyId = tokenData.company || tokenData.companyId || tokenData.company_id;
        this.log('Company ID:', this.companyId);
      }
      
      // Extract user ID from various possible locations
      if (tokenData.user || tokenData.userId || tokenData.user_id) {
        this.userId = tokenData.user || tokenData.userId || tokenData.user_id;
        this.log('User ID:', this.userId);
      }
      
      // If there's a user object with more details
      if (tokenData.user && typeof tokenData.user === 'object') {
        if (tokenData.user.id) {
          this.userId = tokenData.user.id;
        }
        if (tokenData.user.company_id) {
          this.companyId = tokenData.user.company_id;
        }
      }
    } else {
      this.log('Warning: No token found in login response');
      this.log('Response keys:', Object.keys(tokenData));
      
      // If the entire response might be the token
      if (typeof response === 'string' && response.length > 20) {
        this.token = response;
        this.log('Using response as token:', response.substring(0, 20) + '...');
      }
    }

    return response;
  }

  /**
   * Simple login helper (for users without 2FA)
   */
  async simpleLogin(email, password) {
    return this.login(email, password, '', 'write');
  }

  /**
   * Login with 2FA
   */
  async loginWith2FA(email, password, totpCode) {
    return this.login(email, password, totpCode, 'write');
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const response = await this.request('POST', '/logout');
      this.token = null;
      this.companyId = null;
      this.userId = null;
      this.tokenExpiry = null;
      return response;
    } catch (error) {
      // Some APIs don't have a logout endpoint
      this.token = null;
      this.companyId = null;
      this.userId = null;
      this.tokenExpiry = null;
      return { message: 'Logged out locally' };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    const response = await this.request('POST', '/refresh', {
      refresh_token: refreshToken
    });

    if (response.data && response.data.token) {
      this.token = response.data.token;
      if (response.data.expireAt) {
        this.tokenExpiry = response.data.expireAt;
      }
    } else if (response.token) {
      this.token = response.token;
    }

    return response;
  }

  /**
   * Check if token is valid
   */
  isTokenValid() {
    if (!this.token) return false;
    if (!this.tokenExpiry) return true; // Assume valid if no expiry info
    
    const now = new Date();
    const expiry = new Date(this.tokenExpiry);
    return now < expiry;
  }

  // ==================== Users ====================

  /**
   * Get users
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users list
   */
  async getUsers(params = {}) {
    // Add default parameters if needed
    const queryParams = {
      ...params
    };
    
    // If company ID is available, add it
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/users', null, queryParams);
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    return this.request('GET', `/users/${userId}`);
  }

  /**
   * Get current user
   */
  async getMe() {
    try {
      // Try the most common endpoints for current user
      return await this.request('GET', '/users/me');
    } catch (error) {
      try {
        return await this.request('GET', '/me');
      } catch (err) {
        try {
          return await this.request('GET', '/user');
        } catch (e) {
          // If all fail, try to get user by ID if we have it
          if (this.userId) {
            return await this.getUser(this.userId);
          }
          throw new Error('Current user endpoint not found');
        }
      }
    }
  }

  // ==================== Companies ====================

  /**
   * Get companies
   */
  async getCompanies(params = {}) {
    return this.request('GET', '/companies', null, params);
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId) {
    return this.request('GET', `/companies/${companyId}`);
  }

  // ==================== Projects ====================

  /**
   * Get projects
   */
  async getProjects(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/projects', null, queryParams);
  }

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    return this.request('GET', `/projects/${projectId}`);
  }

  /**
   * Create project
   */
  async createProject(data) {
    const projectData = {
      ...data
    };
    
    if (this.companyId && !projectData.company) {
      projectData.company = this.companyId;
    }
    
    return this.request('POST', '/projects', projectData);
  }

  /**
   * Update project
   */
  async updateProject(projectId, data) {
    return this.request('PUT', `/projects/${projectId}`, data);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    return this.request('DELETE', `/projects/${projectId}`);
  }

  // ==================== Tasks ====================

  /**
   * Get tasks
   */
  async getTasks(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/tasks', null, queryParams);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    return this.request('GET', `/tasks/${taskId}`);
  }

  /**
   * Create task
   */
  async createTask(data) {
    const taskData = {
      ...data
    };
    
    if (this.companyId && !taskData.company) {
      taskData.company = this.companyId;
    }
    
    return this.request('POST', '/tasks', taskData);
  }

  /**
   * Update task
   */
  async updateTask(taskId, data) {
    return this.request('PUT', `/tasks/${taskId}`, data);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId) {
    return this.request('DELETE', `/tasks/${taskId}`);
  }

  // ==================== Worklogs (Time Tracking) ====================

  /**
   * Get worklogs
   * @param {Object} params - Query parameters
   * @param {string} params.from - Start date (ISO 8601)
   * @param {string} params.to - End date (ISO 8601)
   * @param {string} params.user - Filter by user
   * @param {string} params.project - Filter by project
   * @param {string} params.task - Filter by task
   * @returns {Promise<Object>} Worklogs
   */
  async getWorklogs(params = {}) {
    const queryParams = {
      ...params
    };
    
    // Note: Time Doctor API uses 'company' not 'company_id' for worklogs
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/worklogs', null, queryParams);
  }

  /**
   * Get worklog by ID
   */
  async getWorklog(worklogId) {
    return this.request('GET', `/worklogs/${worklogId}`);
  }

  /**
   * Create worklog (start time tracking)
   */
  async createWorklog(data) {
    const worklogData = {
      ...data
    };
    
    if (this.companyId && !worklogData.company) {
      worklogData.company = this.companyId;
    }
    
    return this.request('POST', '/worklogs', worklogData);
  }

  /**
   * Update worklog
   */
  async updateWorklog(worklogId, data) {
    return this.request('PUT', `/worklogs/${worklogId}`, data);
  }

  /**
   * Delete worklog
   */
  async deleteWorklog(worklogId) {
    return this.request('DELETE', `/worklogs/${worklogId}`);
  }

  /**
   * Start time tracking
   */
  async startTracking(projectId, taskId, description = '') {
    return this.createWorklog({
      project: projectId,
      task: taskId,
      description,
      start_time: new Date().toISOString()
    });
  }

  /**
   * Stop time tracking
   */
  async stopTracking(worklogId) {
    return this.updateWorklog(worklogId, {
      end_time: new Date().toISOString()
    });
  }

  // ==================== Activity ====================

  /**
   * Get activity
   */
  async getActivity(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/activity', null, queryParams);
  }

  /**
   * Log activity
   */
  async logActivity(data) {
    return this.request('POST', '/activity/log', data);
  }

  // ==================== Screenshots / Files ====================

  /**
   * Get screenshots/files
   */
  async getScreenshots(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    // Time Doctor API uses /files endpoint for screenshots
    return this.request('GET', '/files', null, queryParams);
  }
  
  /**
   * Get files (alias for screenshots)
   */
  async getFiles(params = {}) {
    return this.getScreenshots(params);
  }

  /**
   * Upload screenshot
   */
  async uploadScreenshot(data) {
    return this.request('POST', '/files/upload', data);
  }

  // ==================== Reports ====================

  /**
   * Get summary report
   */
  async getSummaryReport(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/reports/summary', null, queryParams);
  }

  /**
   * Get timesheet report
   */
  async getTimesheetReport(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/reports/timesheet', null, queryParams);
  }

  /**
   * Get productivity report
   */
  async getProductivityReport(params = {}) {
    const queryParams = {
      ...params
    };
    
    if (this.companyId && !queryParams.company) {
      queryParams.company = this.companyId;
    }
    
    return this.request('GET', '/reports/productivity', null, queryParams);
  }

  // ==================== Utility Methods ====================

  /**
   * Set authentication token manually
   */
  setToken(token) {
    this.token = token;
    this.log('Token manually set:', token.substring(0, 20) + '...');
  }

  /**
   * Set company ID
   */
  setCompanyId(companyId) {
    this.companyId = companyId;
    this.log('Company ID set:', companyId);
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.token && this.isTokenValid();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      token: this.token ? `${this.token.substring(0, 20)}...` : null,
      tokenExpiry: this.tokenExpiry,
      companyId: this.companyId,
      userId: this.userId,
      debug: this.debug
    };
  }
}

module.exports = TimeDocktorClient;