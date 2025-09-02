# 🚀 Time Tracker API - Quick Reference

## Base URL
```
http://localhost:3000/api/1.0
```

## Authentication Header
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/refresh` | Refresh token |
| POST | `/logout` | User logout |

---

## 👥 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/me` | Get current user |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

---

## 🏢 Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | Get all companies |
| GET | `/companies/:id` | Get company by ID |
| POST | `/companies` | Create company |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |

---

## 📁 Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | Get all projects |
| GET | `/projects/:id` | Get project by ID |
| POST | `/projects` | Create project |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

---

## ✅ Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get task by ID |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |

---

## ⏱️ Worklogs (Time Tracking)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/worklogs` | Get all worklogs |
| GET | `/worklogs/:id` | Get worklog by ID |
| POST | `/worklogs` | Create worklog |
| POST | `/worklogs/start` | Start timer |
| POST | `/worklogs/:id/stop` | Stop timer |
| PUT | `/worklogs/:id` | Update worklog |
| DELETE | `/worklogs/:id` | Delete worklog |

---

## 📊 Activity & Screenshots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activity` | Get activity logs |
| POST | `/activity` | Log activity |
| GET | `/screenshots` | Get screenshots |
| POST | `/screenshots` | Upload screenshot |

---

## 📈 Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/summary` | Get summary report |
| GET | `/reports/timesheet` | Get timesheet report |
| GET | `/reports/productivity` | Get productivity report |

---

## 💰 Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payroll` | Get payroll data |
| POST | `/payroll/generate` | Generate payroll |

---

## 🧾 Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | Get invoices |
| POST | `/invoices` | Create invoice |
| PUT | `/invoices/:id` | Update invoice |
| DELETE | `/invoices/:id` | Delete invoice |

---

## 🔔 Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/:id/read` | Mark as read |

---

## ⚙️ Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get settings |
| PUT | `/settings` | Update settings |

---

## 🔗 Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/integrations` | Get integrations |
| POST | `/integrations` | Connect integration |
| DELETE | `/integrations/:id` | Remove integration |

---

## 🪝 Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks` | Get webhooks |
| POST | `/webhooks` | Create webhook |
| POST | `/webhooks/:id/test` | Test webhook |
| DELETE | `/webhooks/:id` | Delete webhook |

---

## 🧪 Quick Test Commands

### 1. Get JWT Token
```bash
curl -X POST http://localhost:3000/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 2. Create Project
```bash
curl -X POST http://localhost:3000/api/1.0/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"API Testing"}'
```

### 3. Start Time Tracking
```bash
curl -X POST http://localhost:3000/api/1.0/worklogs/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"PROJECT_ID","description":"Working"}'
```

### 4. Get Reports
```bash
curl -X GET "http://localhost:3000/api/1.0/reports/summary?from=2025-09-01&to=2025-09-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Date Filtering
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)

### Search & Filter
- `search`: Search term
- `status`: Filter by status
- `user_id`: Filter by user
- `project_id`: Filter by project

---

## ⚡ Quick Start Script

```bash
#!/bin/bash

# 1. Start server
npm start &

# 2. Wait for server
sleep 3

# 3. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 4. Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/1.0/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quick Test Project"}' \
  | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

# 5. Start tracking
curl -X POST http://localhost:3000/api/1.0/worklogs/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"description\":\"Quick test\"}"

echo "API testing setup complete!"
echo "Token: $TOKEN"
echo "Project ID: $PROJECT_ID"
```

---

## 🎯 Test Default Credentials

### Local Development
- **Email:** `admin@example.com`
- **Password:** `password123`

### Production
- Use your actual Time Doctor credentials

---

## 📚 More Information

- 📖 [Complete Testing Guide](API-TESTING-GUIDE.md)
- 📋 [Main README](README.md)
- 🐛 [Report Issues](https://github.com/iceman-vici/tracker-app/issues)
