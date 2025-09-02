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

    if (this.token) {
      // Time Doctor uses just the token value in Authorization header (no "Bearer" prefix)
      config.headers['Authorization'] = this.token;
    }

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    this.log(`${method} ${url}`, params || data || '');
    if (this.token) {
      this.log('Using token:', this.token.substring(0, 20) + '...');
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
    }
    
    // Add permissions if specified
    if (permissions) {
      loginData.permissions = permissions;
    }
    
    this.log('Login attempt with:', { email, hasPassword: !!password, hasTotpCode: !!totpCode });
    
    const response = await this.request('POST', '/login', loginData);
    
    // Debug: Log the entire response structure
    this.log('Login response structure:', JSON.stringify(response, null, 2));
    
    // Try different possible token locations in the response
    let token = null;
    
    // Check for token in various possible locations
    if (response.data && response.data.token) {
      token = response.data.token;
    } else if (response.token) {
      token = response.token;
    } else if (typeof response === 'string') {
      // Sometimes the token might be returned as a plain string
      token = response;
    } else if (response.access_token) {
      token = response.access_token;
    } else if (response.accessToken) {
      token = response.accessToken;
    }
    
    if (token) {
      this.token = token;
      this.log('Login successful, token saved:', token.substring(0, 20) + '...');
      
      // Store additional info if available
      if (response.data) {
        if (response.data.expireAt) {
          this.tokenExpiry = response.data.expireAt;
          this.log('Token expires at:', response.data.expireAt);
        }
        if (response.data.createdAt) {
          this.log('Token created at:', response.data.createdAt);
        }
        if (response.data.company || response.data.companyId) {
          this.companyId = response.data.company || response.data.companyId;
          this.log('Company ID:', this.companyId);
        }
        if (response.data.user || response.data.userId) {
          this.userId = response.data.user || response.data.userId;
          this.log('User ID:', this.userId);
        }
      }
      
      // Check for company/user info at root level
      if (response.company || response.companyId) {
        this.companyId = response.company || response.companyId;
      }
      if (response.user || response.userId) {
        this.userId = response.user || response.userId;
      }
    } else {
      this.log('Warning: No token found in login response');
      this.log('Response keys:', Object.keys(response));
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
      return await this.request('GET', '/users/me');
    } catch (error) {
      // If /users/me doesn't exist, try /me or /user
      try {
        return await this.request('GET', '/me');
      } catch (err) {
        try {
          return await this.request('GET', '/user');
        } catch (e) {
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
    if (this.companyId && !data.company_id) {
      data.company_id = this.companyId;
    }
    return this.request('POST', '/projects', data);
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
    return this.request('POST', '/tasks', data);
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
    if (this.companyId && !data.company) {
      data.company = this.companyId;
    }
    return this.request('POST', '/worklogs', data);
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
      project_id: projectId,
      task_id: taskId,
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
   * Set authentication token
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