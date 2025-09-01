# Tracker App API Documentation

## 📋 Overview
This document provides comprehensive instructions for testing the Tracker App API routes. The API follows RESTful principles and returns JSON responses.

**Note:** This version uses an **in-memory database** for easy testing without requiring MongoDB installation. Data is stored in memory and will be lost when the server restarts. Perfect for development and testing!

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- No database required! (Uses in-memory storage)

### Installation
```bash
# Clone the repository
git clone https://github.com/iceman-vici/tracker-app.git
cd tracker-app

# Install dependencies
npm install

# Start the server
npm start
```

### Base URL
```
http://localhost:3000/api/v1
```

### Headers
All requests should include:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_TOKEN"
}
```

## 🔑 Authentication

### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securePassword123",
  "firstName": "Test",
  "lastName": "User"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### Login
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "securePassword123"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }
}
```

## 👤 User Endpoints

### Get User Profile
```http
GET /api/v1/users/profile
```

### Update User Profile
```http
PUT /api/v1/users/profile
```

### Get All Users
```http
GET /api/v1/users
```

## 🏢 Company Endpoints

### Get All Companies
```http
GET /api/v1/companies
```

### Create Company
```http
POST /api/v1/companies
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "description": "Leading tech company"
}
```

## 📁 Project Endpoints

### Get All Projects
```http
GET /api/v1/projects
```

### Create Project
```http
POST /api/v1/projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "startDate": "2025-09-01",
  "endDate": "2025-12-31",
  "priority": "high"
}
```

### Get Project Tasks
```http
GET /api/v1/projects/:id/tasks
```

## ✅ Task Endpoints

### Get All Tasks
```http
GET /api/v1/tasks
```

**Query Parameters:**
- `projectId`: Filter by project
- `status`: Filter by status (todo, in_progress, completed)
- `priority`: Filter by priority (low, medium, high, urgent)
- `assignedTo`: Filter by assigned user
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Create Task
```http
POST /api/v1/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "projectId": "project_id_here",
  "priority": "medium",
  "dueDate": "2025-09-15"
}
```

### Update Task
```http
PUT /api/v1/tasks/:id
```

### Delete Task
```http
DELETE /api/v1/tasks/:id
```

### Add Comment to Task
```http
POST /api/v1/tasks/:id/comments
```

**Request Body:**
```json
{
  "text": "This is a comment"
}
```

## ⏱️ Time Tracking Endpoints

### Start Time Tracking
```http
POST /api/v1/time-tracking/start
```

### Stop Time Tracking
```http
POST /api/v1/time-tracking/stop
```

### Get Time Entries
```http
GET /api/v1/time-tracking/entries
```

## 📊 Report Endpoints

### Get Summary Report
```http
GET /api/v1/reports/summary
```

### Get Timesheet Report
```http
GET /api/v1/reports/timesheet
```

## 🧪 Testing Examples

### Complete Test Flow

```bash
# 1. Register a new user
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Save the token from the response
TOKEN="your_token_here"

# 2. Create a company
curl -X POST "http://localhost:3000/api/v1/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Company",
    "email": "info@mycompany.com"
  }'

# 3. Create a project
curl -X POST "http://localhost:3000/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Website Redesign",
    "description": "Redesign company website",
    "startDate": "2025-09-01",
    "endDate": "2025-12-31"
  }'

# 4. Create a task
curl -X POST "http://localhost:3000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Design Homepage",
    "description": "Create new homepage design",
    "projectId": "project_id_here",
    "priority": "high"
  }'

# 5. Get all tasks
curl -X GET "http://localhost:3000/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN"
```

### Using JavaScript (Node.js)
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
let token = '';

// Register user
async function register() {
  const response = await axios.post(`${API_URL}/auth/register`, {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  });
  
  token = response.data.token;
  console.log('Registered:', response.data);
}

// Create a task
async function createTask() {
  const response = await axios.post(
    `${API_URL}/tasks`,
    {
      title: 'New Task',
      description: 'Task description',
      projectId: 'some_project_id'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('Task created:', response.data);
}

// Run tests
async function runTests() {
  await register();
  await createTask();
}

runTests();
```

## 🔍 Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": {
    "field": "name",
    "message": "Name is required"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide a valid token"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Task with ID 999 not found"
}
```

## 📝 Testing Checklist

### Basic Functionality
- [ ] Test user registration
- [ ] Test user login
- [ ] Test token authentication
- [ ] Test creating a company
- [ ] Test creating a project
- [ ] Test creating tasks
- [ ] Test retrieving all tasks
- [ ] Test updating a task
- [ ] Test deleting a task

### API Features
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test sorting
- [ ] Test real-time updates (Socket.io)
- [ ] Test file uploads
- [ ] Test rate limiting

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Default:** 100 requests per 15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693526400
```

## ⚡ Real-time Features

The API supports real-time updates via Socket.io. Connect to receive live updates:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to real-time updates');
});

socket.on('task:updated', (data) => {
  console.log('Task updated:', data);
});
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-this
CORS_ORIGIN=http://localhost:3000
```

## 📚 Additional Resources

- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [JWT Documentation](https://jwt.io/)

## 🤝 Support

For questions or issues:
1. Check the error message and status code
2. Verify your authentication token
3. Ensure correct request format
4. Review this documentation
5. Create an issue on GitHub

---

**Version:** 1.0.0 (In-Memory Database Edition)  
**Last Updated:** September 2025  
**No MongoDB Required!** 🎉