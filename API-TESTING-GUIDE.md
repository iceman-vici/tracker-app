# 🧪 Time Tracker API - Complete Testing Guide

## 📋 Overview

This comprehensive testing guide provides step-by-step instructions for testing all API endpoints in the Time Tracker application. Whether you're using the local development server or connecting to the production Time Doctor API, this guide will help you understand and test every feature.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- REST client (Postman, Insomnia, or curl)
- Terminal/Command Prompt

### Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/iceman-vici/tracker-app.git
cd tracker-app

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Start the development server
npm start

# 5. Server should be running at:
# http://localhost:3000
# API Base URL: http://localhost:3000/api/1.0
```

## 🔧 Environment Configuration

### Local Development (.env)
```env
NODE_ENV=development
PORT=3000
API_VERSION=1.0
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# Logging
LOG_LEVEL=debug
LOG_MAX_FILES=14d
LOG_MAX_SIZE=20m
```

## 🧪 Automated Testing

### Run the Test Suite

```bash
# Run the built-in test script
node test-api.js

# Expected output:
# ==================================================
# Time Tracker API Test Suite
# API Base URL: http://localhost:3000/api/1.0
# ==================================================
# 
# Testing LOGIN endpoint...
# ✓ Login successful
#   Token: eyJhbGciOiJIUzI1NiIsInR5...
#   User: admin@example.com
# 
# Testing REGISTER endpoint...
# ✓ Registration successful
#   New user: test1725267890123@example.com
# 
# ... (more tests)
# 
# ==================================================
# Test Summary
# ==================================================
# ✅ All tests passed!
```

### Run with npm
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Run Jest tests (if available)
npm test
```

## 📡 Manual API Testing

### Base URL
- **Local Development:** `http://localhost:3000/api/1.0`
- **Production:** `https://api2.timedoctor.com/api/1.0`

### Headers Required
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
}
```

---

## 🔐 Authentication Endpoints

### 1. Register New User

**Endpoint:** `POST /api/1.0/register`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "username": "newuser",
  "first_name": "John",
  "last_name": "Doe",
  "timezone": "America/New_York"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_12345",
    "email": "newuser@example.com",
    "username": "newuser",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "created_at": "2025-09-02T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/1.0/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "username": "newuser",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 2. Login User

**Endpoint:** `POST /api/1.0/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_admin",
    "email": "admin@example.com",
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "lastLogin": "2025-09-02T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 3. Refresh Token

**Endpoint:** `POST /api/1.0/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout

**Endpoint:** `POST /api/1.0/logout`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

## 👥 User Management Endpoints

### 1. Get All Users

**Endpoint:** `GET /api/1.0/users`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (admin, manager, user)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/1.0/users?page=1&limit=5&role=user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "user_12345",
      "email": "user@example.com",
      "username": "testuser",
      "first_name": "Test",
      "last_name": "User",
      "role": "user",
      "status": "active",
      "created_at": "2025-09-02T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 15,
    "pages": 3
  }
}
```

### 2. Get Current User Profile

**Endpoint:** `GET /api/1.0/users/me`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

### 3. Get User by ID

**Endpoint:** `GET /api/1.0/users/:userId`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

### 4. Update User

**Endpoint:** `PUT /api/1.0/users/:userId`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "timezone": "America/Los_Angeles",
  "hourly_rate": 50.00
}
```

### 5. Delete User

**Endpoint:** `DELETE /api/1.0/users/:userId`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

---

## 🏢 Company Management Endpoints

### 1. Get Companies

**Endpoint:** `GET /api/1.0/companies`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

### 2. Get Company Details

**Endpoint:** `GET /api/1.0/companies/:companyId`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

### 3. Create Company

**Endpoint:** `POST /api/1.0/companies`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "description": "Software development company",
  "website": "https://acme.com",
  "timezone": "America/New_York",
  "settings": {
    "work_hours_per_day": 8,
    "currency": "USD",
    "screenshot_frequency": 3
  }
}
```

---

## 📁 Project Management Endpoints

### 1. Get All Projects

**Endpoint:** `GET /api/1.0/projects`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: active, archived, completed
- `search`: Search by name
- `user_id`: Filter by assigned user

**Example:**
```bash
curl -X GET "http://localhost:3000/api/1.0/projects?status=active&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create Project

**Endpoint:** `POST /api/1.0/projects`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "company_id": "company_123",
  "status": "active",
  "startDate": "2025-09-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z",
  "budget": 50000,
  "hourly_rate": 75.00,
  "assigned_users": ["user_123", "user_456"]
}
```

**Response (201 Created):**
```json
{
  "message": "Project created successfully",
  "data": {
    "_id": "project_12345",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "status": "active",
    "created_at": "2025-09-02T10:30:00.000Z",
    "assigned_users": ["user_123", "user_456"]
  }
}
```

### 3. Update Project

**Endpoint:** `PUT /api/1.0/projects/:projectId`

### 4. Delete Project

**Endpoint:** `DELETE /api/1.0/projects/:projectId`

---

## ✅ Task Management Endpoints

### 1. Get All Tasks

**Endpoint:** `GET /api/1.0/tasks`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `project_id`: Filter by project
- `status`: todo, in_progress, completed
- `priority`: low, medium, high, urgent
- `assigned_to`: Filter by assigned user

### 2. Create Task

**Endpoint:** `POST /api/1.0/tasks`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Create login and registration system",
  "projectId": "project_12345",
  "assigned_to": "user_123",
  "priority": "high",
  "status": "todo",
  "due_date": "2025-09-15T23:59:59.999Z",
  "estimated_hours": 16
}
```

### 3. Update Task

**Endpoint:** `PUT /api/1.0/tasks/:taskId`

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "urgent",
  "estimated_hours": 20
}
```

---

## ⏱️ Time Tracking (Worklogs) Endpoints

### 1. Get Worklogs

**Endpoint:** `GET /api/1.0/worklogs`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `user_id`: Filter by user
- `project_id`: Filter by project
- `task_id`: Filter by task

**Example:**
```bash
curl -X GET "http://localhost:3000/api/1.0/worklogs?from=2025-09-01&to=2025-09-30&project_id=project_123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create Worklog (Manual Entry)

**Endpoint:** `POST /api/1.0/worklogs`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "project_id": "project_12345",
  "task_id": "task_67890",
  "description": "Working on user authentication",
  "start_time": "2025-09-02T09:00:00.000Z",
  "end_time": "2025-09-02T12:00:00.000Z",
  "duration": 10800,
  "keyboard_strokes": 2500,
  "mouse_clicks": 450,
  "activity_level": 85
}
```

**Response (201 Created):**
```json
{
  "message": "Worklog created successfully",
  "data": {
    "id": "worklog_12345",
    "project_id": "project_12345",
    "task_id": "task_67890",
    "user_id": "user_123",
    "description": "Working on user authentication",
    "start_time": "2025-09-02T09:00:00.000Z",
    "end_time": "2025-09-02T12:00:00.000Z",
    "duration": 10800,
    "status": "completed",
    "created_at": "2025-09-02T12:01:00.000Z"
  }
}
```

### 3. Start Timer (Real-time Tracking)

**Endpoint:** `POST /api/1.0/worklogs/start`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "project_id": "project_12345",
  "task_id": "task_67890",
  "description": "Starting work on authentication system"
}
```

### 4. Stop Timer

**Endpoint:** `POST /api/1.0/worklogs/:worklogId/stop`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

### 5. Update Worklog

**Endpoint:** `PUT /api/1.0/worklogs/:worklogId`

### 6. Delete Worklog

**Endpoint:** `DELETE /api/1.0/worklogs/:worklogId`

---

## 📊 Activity & Screenshots Endpoints

### 1. Log Activity

**Endpoint:** `POST /api/1.0/activity`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "worklog_id": "worklog_12345",
  "timestamp": "2025-09-02T10:30:00.000Z",
  "keyboard_strokes": 150,
  "mouse_clicks": 25,
  "active_window": "Visual Studio Code",
  "url": "https://github.com/project",
  "activity_level": 90
}
```

### 2. Get Activity Logs

**Endpoint:** `GET /api/1.0/activity`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `from`: Start date
- `to`: End date
- `user_id`: Filter by user
- `worklog_id`: Filter by worklog

### 3. Upload Screenshot

**Endpoint:** `POST /api/1.0/screenshots`
**Headers:** `Authorization: Bearer YOUR_TOKEN`
**Content-Type:** `multipart/form-data`

**Form Data:**
- `screenshot`: Image file
- `worklog_id`: Associated worklog ID
- `timestamp`: When screenshot was taken

### 4. Get Screenshots

**Endpoint:** `GET /api/1.0/screenshots`
**Query Parameters:**
- `worklog_id`: Filter by worklog
- `date`: Specific date (YYYY-MM-DD)

---

## 📈 Reports Endpoints

### 1. Summary Report

**Endpoint:** `GET /api/1.0/reports/summary`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `from`: Start date (required)
- `to`: End date (required)
- `user_id`: Filter by user
- `project_id`: Filter by project

**Example:**
```bash
curl -X GET "http://localhost:3000/api/1.0/reports/summary?from=2025-09-01&to=2025-09-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "data": {
    "period": {
      "from": "2025-09-01",
      "to": "2025-09-30"
    },
    "summary": {
      "total_hours": 168.5,
      "total_earnings": 12637.50,
      "average_activity": 78.5,
      "projects_worked": 5,
      "tasks_completed": 23
    },
    "breakdown": {
      "by_project": [
        {
          "project_id": "project_123",
          "project_name": "Website Redesign",
          "hours": 45.5,
          "earnings": 3412.50
        }
      ],
      "by_day": [
        {
          "date": "2025-09-01",
          "hours": 8.0,
          "earnings": 600.00
        }
      ]
    }
  }
}
```

### 2. Timesheet Report

**Endpoint:** `GET /api/1.0/reports/timesheet`

### 3. Productivity Report

**Endpoint:** `GET /api/1.0/reports/productivity`

---

## 💰 Payroll Endpoints

### 1. Get Payroll Data

**Endpoint:** `GET /api/1.0/payroll`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Query Parameters:**
- `period`: monthly, weekly, biweekly
- `from`: Start date
- `to`: End date
- `user_id`: Specific user

### 2. Generate Payroll

**Endpoint:** `POST /api/1.0/payroll/generate`

**Request Body:**
```json
{
  "period_start": "2025-09-01",
  "period_end": "2025-09-30",
  "user_ids": ["user_123", "user_456"],
  "include_overtime": true
}
```

---

## 🧾 Invoice Endpoints

### 1. Get Invoices

**Endpoint:** `GET /api/1.0/invoices`

### 2. Create Invoice

**Endpoint:** `POST /api/1.0/invoices`

**Request Body:**
```json
{
  "client_id": "client_123",
  "project_id": "project_123",
  "period_start": "2025-09-01",
  "period_end": "2025-09-30",
  "hourly_rate": 75.00,
  "total_hours": 40,
  "tax_rate": 0.08
}
```

---

## 🔔 Notification Endpoints

### 1. Get Notifications

**Endpoint:** `GET /api/1.0/notifications`

### 2. Mark as Read

**Endpoint:** `PUT /api/1.0/notifications/:notificationId/read`

---

## ⚙️ Settings Endpoints

### 1. Get Settings

**Endpoint:** `GET /api/1.0/settings`

### 2. Update Settings

**Endpoint:** `PUT /api/1.0/settings`

**Request Body:**
```json
{
  "screenshot_frequency": 5,
  "idle_timeout": 300,
  "work_hours_start": "09:00",
  "work_hours_end": "17:00",
  "timezone": "America/New_York"
}
```

---

## 🔗 Integration Endpoints

### 1. Get Integrations

**Endpoint:** `GET /api/1.0/integrations`

### 2. Connect Integration

**Endpoint:** `POST /api/1.0/integrations`

**Request Body:**
```json
{
  "type": "slack",
  "credentials": {
    "webhook_url": "https://hooks.slack.com/...",
    "channel": "#general"
  },
  "settings": {
    "notify_on_start": true,
    "notify_on_stop": true
  }
}
```

---

## 🪝 Webhook Endpoints

### 1. Create Webhook

**Endpoint:** `POST /api/1.0/webhooks`

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["worklog.created", "worklog.updated", "user.login"],
  "secret": "webhook_secret_key"
}
```

### 2. Test Webhook

**Endpoint:** `POST /api/1.0/webhooks/:webhookId/test`

---

## 🧪 Advanced Testing Scenarios

### 1. Complete Time Tracking Workflow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# 2. Create a project
curl -X POST http://localhost:3000/api/1.0/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Testing Project",
    "description": "Testing the API endpoints"
  }'

# 3. Create a task
curl -X POST http://localhost:3000/api/1.0/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Testing Task",
    "projectId": "PROJECT_ID_FROM_STEP_2",
    "priority": "high"
  }'

# 4. Start time tracking
curl -X POST http://localhost:3000/api/1.0/worklogs/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_ID",
    "task_id": "TASK_ID",
    "description": "Working on API testing"
  }'

# 5. Log some activity
curl -X POST http://localhost:3000/api/1.0/activity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "worklog_id": "WORKLOG_ID",
    "keyboard_strokes": 100,
    "mouse_clicks": 20,
    "activity_level": 85
  }'

# 6. Stop time tracking
curl -X POST http://localhost:3000/api/1.0/worklogs/WORKLOG_ID/stop \
  -H "Authorization: Bearer YOUR_TOKEN"

# 7. Get summary report
curl -X GET "http://localhost:3000/api/1.0/reports/summary?from=2025-09-01&to=2025-09-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Bulk Operations Testing

```javascript
// Node.js script for bulk testing
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/1.0';
let token = '';

async function bulkTest() {
  // Login first
  const loginResponse = await axios.post(`${API_BASE}/login`, {
    email: 'admin@example.com',
    password: 'password123'
  });
  token = loginResponse.data.token;

  // Create multiple projects
  const projects = [];
  for (let i = 1; i <= 5; i++) {
    const project = await axios.post(`${API_BASE}/projects`, {
      name: `Test Project ${i}`,
      description: `Description for project ${i}`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    projects.push(project.data.data);
  }

  // Create tasks for each project
  for (const project of projects) {
    for (let j = 1; j <= 3; j++) {
      await axios.post(`${API_BASE}/tasks`, {
        title: `Task ${j} for ${project.name}`,
        projectId: project._id,
        priority: j === 1 ? 'high' : j === 2 ? 'medium' : 'low'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }

  console.log('Bulk test completed successfully!');
}

bulkTest().catch(console.error);
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Server Not Starting
```bash
# Check if port is in use
lsof -i :3000

# Try different port
PORT=3001 npm start
```

#### 2. Authentication Errors
```bash
# Check token expiration
# Tokens expire after 24 hours by default
# Login again to get new token
```

#### 3. Rate Limiting
```bash
# If you see "Too many requests" error
# Wait for the rate limit window to reset (15 minutes)
# Or increase limits in .env file
```

#### 4. CORS Issues
```bash
# Add your frontend domain to CORS whitelist
# Update src/server.js cors configuration
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Health Check

**Endpoint:** `GET /api/1.0/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-02T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "128 MB"
  },
  "database": "connected"
}
```

---

## 📚 Additional Resources

### Postman Collection
Import the API collection for easy testing:
```json
{
  "info": {
    "name": "Time Tracker API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/1.0"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### Environment Variables Reference
```env
# Server Configuration
NODE_ENV=development|production
PORT=3000
API_VERSION=1.0

# Security
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database (if using external DB)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=timetracker
DB_USER=username
DB_PASS=password

# File Storage
UPLOAD_PATH=./uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info|debug|warn|error
LOG_MAX_FILES=14d
LOG_MAX_SIZE=20m
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json http://localhost:3000/api/1.0/login

# Test authenticated endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/1.0/users
```

### Security Testing

```bash
# Test for SQL injection
curl -X POST http://localhost:3000/api/1.0/login \
  -d '{"email":"admin@example.com'\''OR 1=1--","password":"anything"}'

# Test for XSS
curl -X POST http://localhost:3000/api/1.0/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"<script>alert(\"XSS\")</script>"}'
```

---

## ✅ Testing Checklist

### Before Testing
- [ ] Server is running
- [ ] Environment variables are set
- [ ] Database is connected (if using external DB)
- [ ] All dependencies are installed

### Authentication Tests
- [ ] User registration
- [ ] User login
- [ ] Token refresh
- [ ] User logout
- [ ] Invalid credentials handling

### Core Feature Tests
- [ ] User management (CRUD)
- [ ] Company management
- [ ] Project management
- [ ] Task management
- [ ] Time tracking (start/stop)
- [ ] Activity logging
- [ ] Screenshot upload
- [ ] Report generation

### Edge Cases
- [ ] Invalid data validation
- [ ] Authorization checks
- [ ] Rate limiting
- [ ] File upload limits
- [ ] Concurrent operations

### Performance Tests
- [ ] Response times < 200ms
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Database query performance

---

## 📞 Support & Contributing

### Getting Help
- Check the main [README.md](README.md) for overview
- Review error logs in `logs/` directory
- Check the GitHub issues
- Contact: [Issues](https://github.com/iceman-vici/tracker-app/issues)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

---

**Last Updated:** September 2025  
**API Version:** 1.0  
**Test Coverage:** All major endpoints covered