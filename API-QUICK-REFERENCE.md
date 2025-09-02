# 🚀 Time Doctor API - Quick Reference

## Base URL
```
https://api2.timedoctor.com/api/1.0
```

## Authentication Header
```
Authorization: Bearer YOUR_TIMEDOCTOR_TOKEN
```

---

## 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login to Time Doctor |
| POST | `/logout` | Logout from Time Doctor |
| POST | `/refresh` | Refresh authentication token |

---

## 👥 Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users from your Time Doctor account |
| GET | `/users/me` | Get current user profile |
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
| GET | `/worklogs` | Get all time entries |
| GET | `/worklogs/:id` | Get worklog by ID |
| POST | `/worklogs` | Create time entry |
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

### 1. Login to Time Doctor
```bash
curl -X POST https://api2.timedoctor.com/api/1.0/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "permissions": "write"
  }'
```

### 2. Get Your Time Doctor Users
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/users"
```

### 3. Get Users with Filters
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/users?filter[role]=admin&detail=full"
```

### 4. Get Your Profile
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/users/me"
```

### 5. Get Projects
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/projects"
```

### 6. Get Time Entries
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/worklogs?from=2024-01-01&to=2024-01-31"
```

### 7. Get Reports
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://api2.timedoctor.com/api/1.0/reports/summary?from=2024-01-01&to=2024-01-31"
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
- `company`: Your Time Doctor company ID

---

## ⚡ Time Doctor Users API - Complete Parameters

### All Supported Query Parameters:
```
company, user, manager, tag, self, detail, task-project-names, 
no-tag, include-archived-users, deleted, page, limit, sort,
filter[id], filter[email], filter[name], filter[tag], 
filter[keywords], filter[role], filter[showOnReports], 
filter[invitePending], filter[inviteAccepted], filter[payrollAccess], 
filter[screenshots], filter[videos], filter[created], filter[hostName], 
filter[os], filter[hiredAt], filter[lastTrack], filter[lastActiveTrack], 
filter[clientVersion], filter[ip], filter[show-on-reports], 
filter[payroll-access], filter[host-name], filter[hired-at], 
filter[last-track], filter[last-active-track], filter[client-version], 
filter[invite-pending], filter[invite-accepted], filter[tag-count]
```

### Example Time Doctor Users Query:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api2.timedoctor.com/api/1.0/users?company=YOUR_COMPANY_ID&detail=full&task-project-names=true&filter[role]=admin&filter[showOnReports]=true&page=1&limit=10&sort=email"
```

---

## 🔑 Environment Setup

Create `.env` file:
```env
TIMEDOCTOR_API_URL=https://api2.timedoctor.com/api/1.0
TIMEDOCTOR_EMAIL=your-email@example.com
TIMEDOCTOR_PASSWORD=your-password
TIMEDOCTOR_COMPANY_ID=your-company-id
```

---

## ⚠️ Important Notes

- **Production API:** All requests go to Time Doctor's live API
- **Rate Limits:** Respect Time Doctor's API rate limits
- **Authentication:** Use your actual Time Doctor account credentials
- **Company ID:** Required for most endpoints
- **Permissions:** Request appropriate permission levels (read/write/admin)

---

## 📚 More Information

- 📖 [Complete Testing Guide](API-TESTING-GUIDE.md)
- 📋 [Main README](README.md)
- 🔗 [Time Doctor API Docs](https://timedoctor.redoc.ly/)
- 🐛 [Report Issues](https://github.com/iceman-vici/tracker-app/issues)

---

**Time Doctor API:** https://api2.timedoctor.com/api/1.0  
**Documentation:** https://timedoctor.redoc.ly/  
**Last Updated:** September 2025