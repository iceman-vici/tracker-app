# Time Tracker API - Time Doctor Clone & Client

## 📋 Overview

This repository contains:
1. **Local Time Doctor API Clone** - A complete clone of Time Doctor's API for development and testing
2. **Time Doctor API Client** - A JavaScript client to connect to the real Time Doctor API at `https://api2.timedoctor.com/api/1.0`

## 🎯 Features

- ✅ **Dual Mode**: Connect to local server OR real Time Doctor API
- ✅ **Full API Coverage**: All major Time Doctor endpoints supported
- ✅ **Time Tracking**: Start/stop timers, manage worklogs
- ✅ **Project Management**: Projects, tasks, and assignments
- ✅ **Reporting**: Summary, timesheet, and productivity reports
- ✅ **Real-time Updates**: Socket.io support for live tracking
- ✅ **No Database Required**: Local server uses in-memory storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Time Doctor account (for production API)

### Installation
```bash
# Clone the repository
git clone https://github.com/iceman-vici/tracker-app.git
cd tracker-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the server
npm start

# Server runs at: http://localhost:3000/api/1.0
```

## 🧪 API Testing Documentation

📚 **Comprehensive Testing Guides Available:**

- **[📖 Complete API Testing Guide](API-TESTING-GUIDE.md)** - Detailed testing instructions with examples, cURL commands, and troubleshooting
- **[⚡ API Quick Reference](API-QUICK-REFERENCE.md)** - Cheat sheet with all endpoints and quick test commands

### Quick Test
```bash
# Run the built-in test suite
node test-api.js

# Expected: All tests should pass ✅
```

## 🔀 Two Ways to Use This Project

### Option 1: Local Development Server

Start your own Time Doctor API clone locally:

```bash
# Start the local server
npm start

# Server runs at: http://localhost:3000/api/1.0
```

### Option 2: Connect to Real Time Doctor API

Use the included client to connect to the production Time Doctor API:

```javascript
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0',
  debug: true
});

// Login with your Time Doctor credentials
await client.login('your-email@example.com', 'your-password');

// Start using the API
const worklogs = await client.getWorklogs();
```

## 🔐 Time Doctor API Client

### Basic Usage

```javascript
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

// Create client instance
const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0', // Real API
  // baseURL: 'http://localhost:3000/api/1.0',     // Local API
  debug: true
});

// Login
const loginResponse = await client.login('email@example.com', 'password');
console.log('Logged in:', loginResponse.user);

// Get projects
const projects = await client.getProjects();

// Get tasks
const tasks = await client.getTasks();

// Start time tracking
const worklog = await client.startTracking('project_id', 'task_id', 'Working on feature');

// Stop time tracking
await client.stopTracking(worklog.data.id);

// Get worklogs for date range
const logs = await client.getWorklogs({
  from: '2025-09-01',
  to: '2025-09-02'
});

// Get reports
const report = await client.getSummaryReport({
  from: '2025-09-01',
  to: '2025-09-30'
});
```

### Available Methods

#### Authentication
- `login(email, password)` - Authenticate with Time Doctor
- `logout()` - End session
- `refreshToken(refreshToken)` - Refresh authentication token

#### Users
- `getUsers(params)` - Get list of users
- `getUser(userId)` - Get specific user
- `getMe()` - Get current user

#### Companies
- `getCompanies(params)` - Get companies
- `getCompany(companyId)` - Get specific company

#### Projects
- `getProjects(params)` - Get projects
- `getProject(projectId)` - Get specific project
- `createProject(data)` - Create new project
- `updateProject(projectId, data)` - Update project
- `deleteProject(projectId)` - Delete project

#### Tasks
- `getTasks(params)` - Get tasks
- `getTask(taskId)` - Get specific task
- `createTask(data)` - Create new task
- `updateTask(taskId, data)` - Update task
- `deleteTask(taskId)` - Delete task

#### Worklogs (Time Tracking)
- `getWorklogs(params)` - Get time entries
- `getWorklog(worklogId)` - Get specific worklog
- `createWorklog(data)` - Create worklog entry
- `updateWorklog(worklogId, data)` - Update worklog
- `deleteWorklog(worklogId)` - Delete worklog
- `startTracking(projectId, taskId, description)` - Start timer
- `stopTracking(worklogId)` - Stop timer

#### Activity & Screenshots
- `getActivity(params)` - Get activity logs
- `logActivity(data)` - Log activity
- `getScreenshots(params)` - Get screenshots
- `uploadScreenshot(data)` - Upload screenshot

#### Reports
- `getSummaryReport(params)` - Get summary report
- `getTimesheetReport(params)` - Get timesheet report
- `getProductivityReport(params)` - Get productivity report

## 🧪 Testing Examples

### Run Interactive Examples

```bash
# Test with local server
node examples/time-doctor-api-example.js local

# Test with production API (requires credentials in .env)
node examples/time-doctor-api-example.js production

# Interactive mode
node examples/time-doctor-api-example.js local --interactive
```

### Environment Configuration

Edit `.env` file:

```env
# For local development
API_ENV=local

# For production Time Doctor API
API_ENV=production
TIMEDOCTOR_EMAIL=your-email@example.com
TIMEDOCTOR_PASSWORD=your-password
```

### Test Script

```bash
# Run API tests
node test-api.js
```

## 📚 API Endpoints Reference

### Base URLs
- **Production**: `https://api2.timedoctor.com/api/1.0`
- **Local Clone**: `http://localhost:3000/api/1.0`

### Authentication
```http
POST /api/1.0/login
POST /api/1.0/register
POST /api/1.0/logout
POST /api/1.0/refresh
```

### Core Endpoints
```http
# Users
GET    /api/1.0/users
GET    /api/1.0/users/:id
GET    /api/1.0/users/me
PUT    /api/1.0/users/:id
DELETE /api/1.0/users/:id

# Projects
GET    /api/1.0/projects
GET    /api/1.0/projects/:id
POST   /api/1.0/projects
PUT    /api/1.0/projects/:id
DELETE /api/1.0/projects/:id

# Tasks
GET    /api/1.0/tasks
GET    /api/1.0/tasks/:id
POST   /api/1.0/tasks
PUT    /api/1.0/tasks/:id
DELETE /api/1.0/tasks/:id

# Worklogs (Time Tracking)
GET    /api/1.0/worklogs
GET    /api/1.0/worklogs/:id
POST   /api/1.0/worklogs
PUT    /api/1.0/worklogs/:id
DELETE /api/1.0/worklogs/:id

# Reports
GET    /api/1.0/reports/summary
GET    /api/1.0/reports/timesheet
GET    /api/1.0/reports/productivity
```

**👉 For detailed testing instructions and examples, see [API Testing Guide](API-TESTING-GUIDE.md)**

## 🔧 Configuration

### API Configuration (`src/config/apiConfig.js`)

```javascript
const config = {
  environment: 'local', // or 'production'
  endpoints: {
    local: {
      baseURL: 'http://localhost:3000/api/1.0'
    },
    production: {
      baseURL: 'https://api2.timedoctor.com/api/1.0'
    }
  }
};
```

### Switch Between Environments

```javascript
const apiConfig = require('./src/config/apiConfig');

// Switch to production
apiConfig.setEnvironment('production');

// Switch to local
apiConfig.setEnvironment('local');
```

## 📊 Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": {
    "code": 400,
    "message": "Error message",
    "details": [ ... ]
  }
}
```

## ⚡ Real-time Features

Connect via Socket.io for real-time updates (local server only):

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('user:status:update', (data) => {
  console.log('User status changed:', data);
});
```

## 🚦 Rate Limiting

- **Production API**: Check Time Doctor's official limits
- **Local Server**: 100 requests per 15 minutes (configurable)

## 📝 Default Test Accounts

### Local Server
- **Email:** admin@example.com
- **Password:** password123

### Production API
- Use your actual Time Doctor credentials

## 🛠️ Development

### Project Structure
```
tracker-app/
├── src/
│   ├── clients/
│   │   └── TimeDocktorClient.js    # Time Doctor API client
│   ├── config/
│   │   ├── apiConfig.js           # API configuration
│   │   └── database.js            # In-memory database
│   ├── routes/                    # API route handlers
│   ├── models/                    # Data models
│   └── server.js                  # Express server
├── examples/
│   └── time-doctor-api-example.js # Usage examples
├── test-api.js                    # API test script
├── API-TESTING-GUIDE.md           # Complete testing guide
├── API-QUICK-REFERENCE.md         # Quick reference cheat sheet
└── README.md
```

### Running Tests
```bash
# Test local server
npm test

# Test API endpoints
node test-api.js

# Test Time Doctor client
node examples/time-doctor-api-example.js
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- **[📖 API Testing Guide](API-TESTING-GUIDE.md)** - Comprehensive testing documentation
- **[⚡ Quick Reference](API-QUICK-REFERENCE.md)** - API endpoints cheat sheet
- [Time Doctor API Documentation](https://api2.timedoctor.com/doc)
- [Time Doctor Official Site](https://www.timedoctor.com)
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)

## ⚠️ Important Notes

1. **Never commit real credentials** - Always use environment variables
2. **Rate Limits** - Be aware of Time Doctor's API rate limits
3. **Data Privacy** - Handle user data responsibly
4. **API Changes** - Time Doctor may update their API

## 📄 License

This project is licensed under the MIT License.

---

**Version:** 1.0.0  
**API Compatibility:** Time Doctor API v1.0  
**Last Updated:** September 2025  
**Repository:** [github.com/iceman-vici/tracker-app](https://github.com/iceman-vici/tracker-app)