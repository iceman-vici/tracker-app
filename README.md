# Time Doctor API - Working Configuration ✅

## 🎯 **The Working Solution**

The Time Doctor API requires the token to be passed as a **query parameter** in the URL, not in the Authorization header!

## ✅ **Correct Format:**
```bash
# Token goes in the URL as a query parameter
https://api2.timedoctor.com/api/1.0/[endpoint]?token=TOKEN&company=COMPANY_ID
```

## ❌ **Not This:**
```bash
# Authorization header doesn't work consistently
-H 'Authorization: TOKEN'
```

## 🚀 **Quick Start**

### 1. Set up your environment
```bash
cp .env.example .env
# Add your credentials:
# TIME_DOCTOR_EMAIL=your-email@example.com
# TIME_DOCTOR_PASSWORD=your-password
# TIME_DOCTOR_COMPANY_ID=68b1cb4ae86c38faec59b7f6
```

### 2. Run the working script
```bash
node time-doctor-working.js
```

This will:
- Login and get your token
- Test all endpoints with token as query parameter
- Show you which endpoints are accessible

## 📋 **Working Examples**

### JavaScript
```javascript
const https = require('https');

// Login first
const loginData = {
  email: 'your-email@example.com',
  password: 'your-password',
  permissions: 'write'
};

// Get token from login
const token = 'YOUR_TOKEN_HERE';
const companyId = '68b1cb4ae86c38faec59b7f6';

// Make API calls with token in URL
const url = `/api/1.0/companies?token=${token}`;
const projectsUrl = `/api/1.0/projects?token=${token}&company=${companyId}`;

// Request without Authorization header
const options = {
  hostname: 'api2.timedoctor.com',
  port: 443,
  path: url,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
    // No Authorization header needed!
  }
};
```

### CURL
```bash
# Companies endpoint (works)
curl "https://api2.timedoctor.com/api/1.0/companies?token=YOUR_TOKEN"

# Projects endpoint
curl "https://api2.timedoctor.com/api/1.0/projects?token=YOUR_TOKEN&company=68b1cb4ae86c38faec59b7f6"

# Current user
curl "https://api2.timedoctor.com/api/1.0/me?token=YOUR_TOKEN"
```

## 📊 **Endpoint Status**

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/companies` | ✅ Works | Returns company data with role |
| `/me` | ✅ Works | Returns current user |
| `/projects` | ✅ Works | With company parameter |
| `/tasks` | ✅ Works | With company parameter |
| `/activity` | ✅ Works | With company parameter |
| `/worklogs` | ✅ Works | With company parameter |
| `/users` | ⚠️ 403/401 | Permission restricted |

## 🔑 **Key Points**

1. **Token in URL**: Always pass token as query parameter `?token=TOKEN`
2. **Company ID Required**: Most endpoints need `&company=68b1cb4ae86c38faec59b7f6`
3. **No Auth Header**: Don't use Authorization header
4. **Users Endpoint**: Has special restrictions even with valid token

## 📁 **Important Files**

- **`time-doctor-working.js`** - The working implementation ✅
- **`.env.example`** - Configuration template
- **`debug-users-endpoint.js`** - Debug script for users endpoint issue

## 💡 **Users Endpoint Workaround**

Since the users endpoint has permission issues, use these alternatives:

1. **Get current user**: `/api/1.0/me?token=TOKEN`
2. **Get user data from activity**: Includes user information
3. **Get user data from worklogs**: Contains user references
4. **Check project assignees**: Projects may include user data

## 🎉 **Success!**

Your Time Doctor API integration is working! Use `time-doctor-working.js` as your reference implementation. The key is:

```javascript
// Always use this format
const url = `/api/1.0/endpoint?token=${token}&company=${companyId}`;
```

Run `node time-doctor-working.js` to see it in action!
