# Time Tracker API

A production-ready Time Tracker API that connects to Time Doctor's official API for time tracking, project management, and productivity monitoring.

## Features

- ✅ **Time Doctor API Integration** - Connects directly to Time Doctor production API
- ✅ **In-Memory Database** - No MongoDB required, runs with in-memory storage
- ✅ **Authentication & Authorization** - JWT-based authentication with role-based access
- ✅ **Real-time Updates** - WebSocket support for live updates
- ✅ **RESTful API** - Clean, well-documented API endpoints
- ✅ **Time Tracking** - Start/stop timers, log work hours, track productivity
- ✅ **Project & Task Management** - Create and manage projects and tasks
- ✅ **Reports & Analytics** - Generate time reports and productivity analytics
- ✅ **Screenshots & Activity** - Support for screenshot capture and activity monitoring

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Time Doctor account with API access

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/iceman-vici/tracker-app.git
cd tracker-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example environment file and add your Time Doctor credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Time Doctor credentials:

```env
TIMEDOCTOR_EMAIL=your-email@example.com
TIMEDOCTOR_PASSWORD=your-password
TIMEDOCTOR_API_KEY=your-api-key-if-required
```

### 4. Test the connection

```bash
node quick-start.js
```

### 5. Run API tests

```bash
node test-api.js
```

### 6. Start the server (optional)

If you want to run a local server that proxies to Time Doctor API:

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Configuration

The application is configured to use the Time Doctor production API:
- **Base URL**: `https://api2.timedoctor.com/api/1.0`
- **Authentication**: Email/Password with optional 2FA support

## Time Doctor API Client

The main API client is located in `src/clients/TimeDocktorClient.js`. It provides methods for:

### Authentication
- `login(email, password, totpCode, permissions)` - Full login with all parameters
- `simpleLogin(email, password)` - Simplified login without 2FA
- `loginWith2FA(email, password, totpCode)` - Login with 2FA
- `logout()` - End session
- `refreshToken(refreshToken)` - Refresh authentication token

### Users
- `getUsers(params)` - Get list of users
- `getUser(userId)` - Get specific user
- `getMe()` - Get current user

### Projects
- `getProjects(params)` - Get list of projects
- `getProject(projectId)` - Get specific project
- `createProject(data)` - Create new project
- `updateProject(projectId, data)` - Update project
- `deleteProject(projectId)` - Delete project

### Tasks
- `getTasks(params)` - Get list of tasks
- `getTask(taskId)` - Get specific task
- `createTask(data)` - Create new task
- `updateTask(taskId, data)` - Update task
- `deleteTask(taskId)` - Delete task

### Time Tracking (Worklogs)
- `getWorklogs(params)` - Get time entries
- `getWorklog(worklogId)` - Get specific time entry
- `createWorklog(data)` - Create time entry
- `updateWorklog(worklogId, data)` - Update time entry
- `deleteWorklog(worklogId)` - Delete time entry
- `startTracking(projectId, taskId, description)` - Start timer
- `stopTracking(worklogId)` - Stop timer

### Reports
- `getSummaryReport(params)` - Get summary report
- `getTimesheetReport(params)` - Get timesheet report
- `getProductivityReport(params)` - Get productivity report

### Activity & Screenshots
- `getActivity(params)` - Get activity data
- `logActivity(data)` - Log activity
- `getScreenshots(params)` - Get screenshots
- `uploadScreenshot(data)` - Upload screenshot

## Usage Examples

### Basic Usage

```javascript
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

// Create client instance
const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0'
});

// Login
await client.simpleLogin('your-email@example.com', 'your-password');

// Get worklogs
const worklogs = await client.getWorklogs();
console.log(worklogs);

// Start tracking time
const worklog = await client.startTracking('project-id', 'task-id', 'Working on feature');

// Stop tracking
await client.stopTracking(worklog.id);
```

### With Environment Variables

```javascript
require('dotenv').config();
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');
const apiConfig = require('./src/config/apiConfig');

const client = new TimeDocktorClient({
  baseURL: apiConfig.getCurrentEndpoint().baseURL
});

const credentials = apiConfig.getCredentials();
await client.simpleLogin(credentials.email, credentials.password);
```

## Testing

### Quick Test
```bash
node quick-start.js
```

### Full API Test Suite
```bash
node test-api.js
```

### Test Specific Endpoints
```bash
node test-users-api.js
```

## Project Structure

```
tracker-app/
├── src/
│   ├── clients/
│   │   └── TimeDocktorClient.js    # Time Doctor API client
│   ├── config/
│   │   ├── apiConfig.js            # API configuration
│   │   └── database.js             # In-memory database
│   ├── models/                     # Data models (in-memory)
│   ├── routes/                     # API routes
│   ├── middleware/                 # Express middleware
│   ├── utils/                      # Utility functions
│   └── server.js                   # Express server (optional)
├── examples/                        # Usage examples
├── test-api.js                     # API test script
├── quick-start.js                  # Quick start script
├── package.json                    # Dependencies
└── .env.example                    # Environment variables template
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TIMEDOCTOR_EMAIL` | Your Time Doctor email | Yes |
| `TIMEDOCTOR_PASSWORD` | Your Time Doctor password | Yes |
| `TIMEDOCTOR_API_KEY` | API key if required | Optional |
| `PORT` | Server port (default: 3000) | No |
| `JWT_SECRET` | JWT secret for local sessions | No |
| `CORS_ORIGIN` | CORS allowed origin | No |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No |

## Rate Limiting

Time Doctor API has rate limits:
- 60 requests per minute
- 1000 requests per hour

The client includes retry logic and handles rate limiting automatically.

## Security

- Never commit your `.env` file with real credentials
- Use environment variables for sensitive data
- The application uses JWT for session management
- All API requests use HTTPS
- Rate limiting is enabled by default

## Troubleshooting

### Connection Issues
1. Verify your Time Doctor credentials are correct
2. Check if you have 2FA enabled and use the appropriate login method
3. Ensure your Time Doctor account has API access
4. Check your internet connection
5. Verify the API is accessible from your location

### Authentication Errors
- For 2FA users: Use `client.loginWith2FA()` or `client.login()` with TOTP code
- Token expired: Use `client.refreshToken()` or login again
- Invalid credentials: Double-check email and password

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
1. Check the [API Quick Reference](API-QUICK-REFERENCE.md)
2. Review the [API Testing Guide](API-TESTING-GUIDE.md)
3. Open an issue on GitHub

## Disclaimer

This is an unofficial client for the Time Doctor API. It is not affiliated with or endorsed by Time Doctor.
