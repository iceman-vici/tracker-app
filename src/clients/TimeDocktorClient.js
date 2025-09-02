const axios = require('axios');

/**
 * Time Doctor API Client
 * Connects to the official Time Doctor API at https://api2.timedoctor.com/api/1.0
 */
class TimeDocktorClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'https://api2.timedoctor.com/api/1.0';
    this.token = config.token || null;
    this.companyId = config.companyId || null;
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
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    this.log(`${method} ${url}`, params || data || '');

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
   * @returns {Promise<Object>} Login response with token
   */
  async login(email, password) {
    const response = await this.request('POST', '/login', {
      email,
      password
    });

    if (response.token) {
      this.token = response.token;
      this.log('Login successful, token saved');
    }

    if (response.user && response.user.company_id) {
      this.companyId = response.user.company_id;
      this.log('Company ID saved:', this.companyId);
    }

    return response;
  }

  /**
   * Logout
   */
  async logout() {
    const response = await this.request('POST', '/logout');
    this.token = null;
    this.companyId = null;
    return response;
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    const response = await this.request('POST', '/refresh', {
      refresh_token: refreshToken
    });

    if (response.token) {
      this.token = response.token;
    }

    return response;
  }

  // ==================== Users ====================

  /**
   * Get users
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users list
   */
  async getUsers(params = {}) {
    if (this.companyId && !params.company) {
      params.company = this.companyId;
    }
    return this.request('GET', '/users', null, params);
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
    return this.request('GET', '/users/me');
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
    if (this.companyId && !params.company) {
      params.company = this.companyId;
    }
    return this.request('GET', '/projects', null, params);
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
    if (this.companyId && !params.company) {
      params.company = this.companyId;
    }
    return this.request('GET', '/tasks', null, params);
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
   * @param {string} params.user_id - Filter by user
   * @param {string} params.project_id - Filter by project
   * @param {string} params.task_id - Filter by task
   * @returns {Promise<Object>} Worklogs
   */
  async getWorklogs(params = {}) {
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/worklogs', null, params);
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
    if (this.companyId && !data.company_id) {
      data.company_id = this.companyId;
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
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/activity', null, params);
  }

  /**
   * Log activity
   */
  async logActivity(data) {
    return this.request('POST', '/activity/log', data);
  }

  // ==================== Screenshots ====================

  /**
   * Get screenshots
   */
  async getScreenshots(params = {}) {
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/screenshots', null, params);
  }

  /**
   * Upload screenshot
   */
  async uploadScreenshot(data) {
    return this.request('POST', '/screenshots/upload', data);
  }

  // ==================== Reports ====================

  /**
   * Get summary report
   */
  async getSummaryReport(params = {}) {
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/reports/summary', null, params);
  }

  /**
   * Get timesheet report
   */
  async getTimesheetReport(params = {}) {
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/reports/timesheet', null, params);
  }

  /**
   * Get productivity report
   */
  async getProductivityReport(params = {}) {
    if (this.companyId && !params.company_id) {
      params.company_id = this.companyId;
    }
    return this.request('GET', '/reports/productivity', null, params);
  }

  // ==================== Utility Methods ====================

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set company ID
   */
  setCompanyId(companyId) {
    this.companyId = companyId;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      token: this.token ? `${this.token.substring(0, 10)}...` : null,
      companyId: this.companyId,
      debug: this.debug
    };
  }
}

module.exports = TimeDocktorClient;