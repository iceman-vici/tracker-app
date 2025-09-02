# Time Tracker API - Time Doctor Clone

## 📋 Overview
A complete Time Doctor API clone with time tracking, screenshot capture, activity monitoring, and reporting capabilities. This API follows Time Doctor's API structure and uses an **in-memory database** for easy testing without requiring any database setup.

## 🚀 Quick Start

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

The API will be available at: `http://localhost:3000/api/1.0`

## 🔑 Authentication

### Base URL
```
http://localhost:3000/api/1.0
```

### Login
```http
POST /api/1.0/login
```

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "company_id": "company_id"
  }
}
```

### Register
```http
POST /api/1.0/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure123",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "company_id": "optional_company_id"
}
```

## 📚 API Endpoints

### Users
- `GET /api/1.0/users` - Get all users
- `GET /api/1.0/users/:id` - Get user by ID
- `GET /api/1.0/users/profile` - Get current user profile
- `PUT /api/1.0/users/profile` - Update user profile
- `DELETE /api/1.0/users/:id` - Delete user

### Companies
- `GET /api/1.0/companies` - Get all companies
- `GET /api/1.0/companies/:id` - Get company by ID
- `POST /api/1.0/companies` - Create company
- `PUT /api/1.0/companies/:id` - Update company
- `DELETE /api/1.0/companies/:id` - Delete company

### Projects
- `GET /api/1.0/projects` - Get all projects
- `GET /api/1.0/projects/:id` - Get project by ID
- `POST /api/1.0/projects` - Create project
- `PUT /api/1.0/projects/:id` - Update project
- `DELETE /api/1.0/projects/:id` - Delete project
- `GET /api/1.0/projects/:id/tasks` - Get project tasks

### Tasks
- `GET /api/1.0/tasks` - Get all tasks
- `GET /api/1.0/tasks/:id` - Get task by ID
- `POST /api/1.0/tasks` - Create task
- `PUT /api/1.0/tasks/:id` - Update task
- `DELETE /api/1.0/tasks/:id` - Delete task
- `POST /api/1.0/tasks/:id/comments` - Add comment to task

### Worklogs (Time Tracking)
- `GET /api/1.0/worklogs` - Get worklogs
- `GET /api/1.0/worklogs/:id` - Get specific worklog
- `POST /api/1.0/worklogs` - Create worklog entry
- `PUT /api/1.0/worklogs/:id` - Update worklog
- `DELETE /api/1.0/worklogs/:id` - Delete worklog

**Query Parameters for GET /api/1.0/worklogs:**
- `user_id` - Filter by user
- `company_id` - Filter by company
- `project_id` - Filter by project
- `task_id` - Filter by task
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)

**Worklog Object:**
```json
{
  "id": "worklog_id",
  "user_id": "user_id",
  "company_id": "company_id",
  "project_id": "project_id",
  "task_id": "task_id",
  "start_time": "2025-09-01T09:00:00Z",
  "end_time": "2025-09-01T17:00:00Z",
  "duration": 28800,
  "description": "Working on API implementation",
  "is_manual": false,
  "keyboard_strokes": 5420,
  "mouse_clicks": 1230,
  "active_window": "VS Code"
}
```

### Activity
- `GET /api/1.0/activity` - Get activity logs
- `POST /api/1.0/activity/log` - Log activity

### Screenshots
- `GET /api/1.0/screenshots` - Get screenshots
- `POST /api/1.0/screenshots/upload` - Upload screenshot

### Reports
- `GET /api/1.0/reports/summary` - Get summary report
- `GET /api/1.0/reports/timesheet` - Get timesheet report

### Settings
- `GET /api/1.0/settings` - Get user settings
- `PUT /api/1.0/settings` - Update settings

## 🧪 Testing Examples

### Complete Workflow Example

```bash
# 1. Login (or register first if new user)
curl -X POST http://localhost:3000/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Save the token
TOKEN="your_token_here"

# 2. Create a project
curl -X POST http://localhost:3000/api/1.0/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Development",
    "description": "New company website",
    "startDate": "2025-09-01",
    "endDate": "2025-12-31"
  }'

# 3. Create a task
curl -X POST http://localhost:3000/api/1.0/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Homepage",
    "projectId": "project_id_here",
    "priority": "high"
  }'

# 4. Start tracking time (create worklog)
curl -X POST http://localhost:3000/api/1.0/worklogs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "project_id",
    "task_id": "task_id",
    "description": "Working on homepage design",
    "start_time": "2025-09-01T09:00:00Z"
  }'

# 5. Get worklogs for today
curl -X GET "http://localhost:3000/api/1.0/worklogs?from=2025-09-01&to=2025-09-02" \
  -H "Authorization: Bearer $TOKEN"
```

### JavaScript SDK Example

```javascript
class TimeTrackerAPI {
  constructor(baseURL = 'http://localhost:3000/api/1.0') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    this.token = data.token;
    return data;
  }

  async startWorklog(projectId, taskId, description) {
    const response = await fetch(`${this.baseURL}/worklogs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId,
        task_id: taskId,
        description: description,
        start_time: new Date().toISOString()
      })
    });
    return response.json();
  }

  async getWorklogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/worklogs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}

// Usage
const api = new TimeTrackerAPI();
await api.login('admin@example.com', 'password123');
await api.startWorklog('project_123', 'task_456', 'Working on API');
const worklogs = await api.getWorklogs({ from: '2025-09-01' });
```

## ⚡ Real-time Features

Connect via Socket.io for real-time updates:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected to real-time updates');
});

// Listen for time tracking events
socket.on('user:status:update', (data) => {
  console.log('User status changed:', data);
});

// Send time tracking updates
socket.emit('time:start', {
  taskId: 'task_123',
  projectId: 'project_456'
});
```

## 🔒 Authentication

All API endpoints (except `/login` and `/register`) require authentication via Bearer token:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## 📊 Response Format

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

## 🚦 Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## 🔧 Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📝 Default Test Account

The system creates a default admin account:
- **Email:** admin@example.com
- **Password:** password123

## 💾 Data Storage

This version uses an **in-memory database** for simplicity:
- No database setup required
- Data is stored in memory
- Data resets when server restarts
- Perfect for development and testing

To use a persistent database, you can easily modify the code to use MongoDB, PostgreSQL, or any other database.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- [Time Doctor API Documentation](https://api2.timedoctor.com/api/1.0)
- [Socket.io Documentation](https://socket.io/docs/)
- [JWT Documentation](https://jwt.io/)
- [Express.js Guide](https://expressjs.com/)

## 📄 License

This project is licensed under the MIT License.

---

**Version:** 1.0.0  
**API Compatibility:** Time Doctor API v1.0  
**Last Updated:** September 2025