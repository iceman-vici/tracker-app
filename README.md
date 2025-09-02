# Time Tracker API - Time Doctor Client & Testing Suite

## 📋 Overview

**🎯 Complete Time Doctor API Client & Testing Suite**

This repository provides a comprehensive **Time Doctor API client** with full testing capabilities for the production Time Doctor API at `https://api2.timedoctor.com/api/1.0`.

### 🏆 **What This Provides:**
1. **🎯 Complete Time Doctor Integration** - Full production API client
2. **🔐 Enhanced Authentication** - 2FA, permissions, role-based access
3. **👥 Complete Users Management** - All 45+ Time Doctor query parameters supported
4. **🧪 Comprehensive Testing Suite** - Auto-logging, dedicated test scripts
5. **📚 Extensive Documentation** - 30KB+ of guides and examples

---

## 🚀 **Quick Demo - Connect to Time Doctor API**

```bash
# 1. Clone and setup
git clone https://github.com/iceman-vici/tracker-app.git
cd tracker-app && npm install

# 2. Configure your Time Doctor credentials
cp .env.example .env
# Edit .env with your Time Doctor credentials

# 3. Start the client
npm start

# 4. Login to Time Doctor (token + users automatically displayed)
curl -X POST https://api2.timedoctor.com/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "permissions": "write"
  }'

# 5. Use the logged token to test users API
curl -H "Authorization: Bearer YOUR_TOKEN_FROM_RESPONSE" \
     "https://api2.timedoctor.com/api/1.0/users?detail=full&filter[role]=admin"
```

---

## 🎯 **Time Doctor API Integration**

### 🔗 **Production API URL**
```
https://api2.timedoctor.com/api/1.0
```

### 📡 **Supported Endpoints**

| Category | Endpoint | Status | Features |
|----------|----------|---------|-----------|
| **Auth** | `POST /login` | ✅ Complete | 2FA, permissions, auto-logging |
| **Auth** | `POST /logout` | ✅ Complete | Session management |
| **Users** | `GET /users` | ✅ Complete | All 45+ Time Doctor parameters |
| **Users** | `GET /users/me` | ✅ Complete | Current user profile |
| **Users** | `GET /users/:id` | ✅ Complete | Specific user details |
| **Projects** | `GET /projects` | ✅ Available | Project management |
| **Tasks** | `GET /tasks` | ✅ Available | Task management |
| **Worklogs** | `GET /worklogs` | ✅ Available | Time tracking |
| **Reports** | `GET /reports/*` | ✅ Available | Analytics & reporting |

---

## 🔐 **Time Doctor Authentication**

### 🎫 **Enhanced Login with 2FA**

**Request to Time Doctor API:**
```json
{
  "email": "your-email@timedoctor.com",
  "password": "your-password",
  "totpCode": "123456",
  "permissions": "write"
}
```

**Console Auto-Logging Output:**
```
🎉 TIME DOCTOR LOGIN SUCCESSFUL - TOKEN & USERS DATA
📧 Logged in as: your-email@timedoctor.com
👤 Role: admin
🔐 Permissions: write
🎫 TOKEN: Bearer eyJhbGciOiJIUzI1NiIs...

👥 YOUR TIME DOCTOR USERS:
1. John Manager (john@company.com)
   ID: user_12345 | Role: manager | Status: active
2. Jane Developer (jane@company.com) 
   ID: user_67890 | Role: user | Status: active

💡 Ready-to-use Time Doctor API commands provided...
```

### 🔑 **Your Time Doctor Credentials**

Update `.env` file:
```env
# Time Doctor API Configuration
TIMEDOCTOR_API_URL=https://api2.timedoctor.com/api/1.0
TIMEDOCTOR_EMAIL=your-email@example.com
TIMEDOCTOR_PASSWORD=your-password
TIMEDOCTOR_COMPANY_ID=your-company-id

# Optional: Default permissions
TIMEDOCTOR_DEFAULT_PERMISSIONS=read
```

---

## 👥 **Users API - Full Time Doctor Compatibility**

### 🎯 **All Time Doctor Query Parameters Supported**

**Complete parameter list:**
```
company, user, manager, tag, self, detail, task-project-names, 
no-tag, include-archived-users, deleted, page, limit, sort,
filter[id], filter[email], filter[name], filter[keywords], 
filter[role], filter[showOnReports], filter[payrollAccess],
filter[screenshots], filter[videos], filter[created],
filter[hostName], filter[os], filter[hiredAt], filter[lastTrack],
filter[lastActiveTrack], filter[clientVersion], filter[ip]
... and 25+ more filters
```

**Example Time Doctor API Call:**
```bash
curl -H "Authorization: YOUR_TIMEDOCTOR_TOKEN" \
  "https://api2.timedoctor.com/api/1.0/users?company=your-company&detail=full&task-project-names=true&filter[role]=admin&filter[showOnReports]=true&page=1&limit=10&sort=email"
```

---

## 🧪 **Testing Your Time Doctor Integration**

### 🚀 **Automated Testing**
```bash
# Test all Time Doctor endpoints
npm run test:timedoctor

# Test users endpoint specifically
npm run test:users

# Test authentication flow
npm run test:auth
```

### 📋 **Manual Testing**
```bash
# 1. Configure credentials
cp .env.example .env
# Edit with your Time Doctor credentials

# 2. Test login (see auto-logged token + users)
curl -X POST https://api2.timedoctor.com/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# 3. Test users API (use token from response)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/users"

# 4. Test with advanced filters
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/users?filter[role]=admin&detail=full"
```

---

## 📚 **Complete Documentation**

- **[📖 Complete API Testing Guide](API-TESTING-GUIDE.md)** (22KB) - Detailed Time Doctor API testing
- **[⚡ Quick API Reference](API-QUICK-REFERENCE.md)** (6KB) - Time Doctor endpoints cheat sheet
- **[📋 Changelog](CHANGELOG.md)** - Latest updates and features

---

## 🛠️ **Time Doctor Client Features**

### ⚡ **Easy Integration**
- **Direct Time Doctor Connection** - No local setup required
- **Auto-Token Management** - Handles authentication automatically
- **Smart Error Handling** - Comprehensive Time Doctor API error handling
- **Rate Limit Awareness** - Respects Time Doctor's API limits

### 🎯 **Production Ready Client**
- **JWT Token Handling** - Automatic refresh and management
- **Comprehensive Validation** - Input validation for all endpoints
- **Error Recovery** - Retry logic and failover handling
- **Logging & Monitoring** - Detailed API interaction logs

### 🔧 **Environment Configuration**
```env
# Time Doctor API Settings
TIMEDOCTOR_API_URL=https://api2.timedoctor.com/api/1.0
TIMEDOCTOR_EMAIL=your-email@example.com
TIMEDOCTOR_PASSWORD=your-password

# Client Settings
API_TIMEOUT=30000
MAX_RETRIES=3
LOG_LEVEL=info
```

---

## 📊 **Time Doctor API Response Formats**

### ✅ **Successful User Query Response**
```json
{
  "data": [
    {
      "id": "12345",
      "email": "user@company.com", 
      "first_name": "John",
      "last_name": "Doe",
      "role": "manager",
      "company_id": "67890",
      "show_on_reports": true,
      "payroll_access": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "has_more": true
  }
}
```

### ❌ **Time Doctor API Error Response**
```json
{
  "error": {
    "code": 401,
    "message": "Invalid credentials or expired token"
  }
}
```

---

## 🔍 **Time Doctor API Client Usage**

### 📦 **Client Library**
```javascript
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

// Create client
const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0',
  email: process.env.TIMEDOCTOR_EMAIL,
  password: process.env.TIMEDOCTOR_PASSWORD
});

// Login
await client.login();

// Get users with Time Doctor parameters
const users = await client.getUsers({
  company: 'your-company-id',
  detail: 'full',
  'filter[role]': 'admin',
  page: 1,
  limit: 20
});

// Get current user
const me = await client.getMe();

// Get projects
const projects = await client.getProjects();

// Get time logs
const worklogs = await client.getWorklogs({
  from: '2024-01-01',
  to: '2024-01-31'
});
```

---

## 🤝 **Contributing & Support**

### 🐛 **Found an Issue?**
- Check the [API Testing Guide](API-TESTING-GUIDE.md)
- Verify your Time Doctor credentials
- Check Time Doctor API status
- Open an [issue](https://github.com/iceman-vici/tracker-app/issues) with details

### 💡 **Want to Contribute?**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/timedoctor-enhancement`
3. Test with real Time Doctor API
4. Commit changes: `git commit -m 'Add Time Doctor feature'`
5. Push to branch: `git push origin feature/timedoctor-enhancement`
6. Open a Pull Request

---

## 📚 **Time Doctor Resources**

- **[Time Doctor API Documentation](https://timedoctor.redoc.ly/)**
- **[Time Doctor Developer Portal](https://www.timedoctor.com/api)**
- **[API Rate Limits](https://timedoctor.redoc.ly/#section/Rate-Limiting)**
- **[Authentication Guide](https://timedoctor.redoc.ly/#tag/Authentication)**

---

## ⚠️ **Important Notes**

- **Real API Integration:** This connects to the actual Time Doctor production API
- **Rate Limits:** Respect Time Doctor's API rate limits (check their documentation)
- **Credentials Security:** Never commit your actual Time Doctor credentials
- **Token Expiry:** Handle token refresh for long-running applications
- **API Changes:** Monitor Time Doctor's changelog for API updates

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Ready to Connect to Time Doctor!**

**You now have a complete Time Doctor API integration with:**
- ✅ Full authentication with 2FA support
- ✅ Complete users management with all Time Doctor parameters  
- ✅ Auto-logging for easy development and testing
- ✅ Comprehensive test suite for the production API
- ✅ Professional client library for seamless integration

**Start integrating with Time Doctor's API today!** 🚀

---

**Version:** 1.0.0  
**Time Doctor API:** https://api2.timedoctor.com/api/1.0  
**Last Updated:** September 2, 2025  
**Repository:** [github.com/iceman-vici/tracker-app](https://github.com/iceman-vici/tracker-app)