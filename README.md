# Tracker App API Documentation

## 📋 Overview
This document provides comprehensive instructions for testing the Tracker App API routes. The API follows RESTful principles and returns JSON responses.

## 🚀 Getting Started

### Base URL
```
http://localhost:3000/api
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
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

## 📊 Tracker Endpoints

### Get All Trackers
```http
GET /api/trackers
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `sort` (optional): Sort field (default: createdAt)
- `order` (optional): Sort order - asc/desc (default: desc)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/trackers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Project Tracker",
      "description": "Track project progress",
      "status": "active",
      "createdAt": "2025-09-01T10:00:00Z",
      "updatedAt": "2025-09-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Get Single Tracker
```http
GET /api/trackers/:id
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/trackers/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Project Tracker",
    "description": "Track project progress",
    "status": "active",
    "metadata": {
      "tags": ["important", "work"],
      "priority": "high"
    },
    "createdAt": "2025-09-01T10:00:00Z",
    "updatedAt": "2025-09-01T10:00:00Z"
  }
}
```

### Create Tracker
```http
POST /api/trackers
```

**Request Body:**
```json
{
  "name": "New Tracker",
  "description": "Description of the tracker",
  "type": "task",
  "metadata": {
    "tags": ["work", "urgent"],
    "priority": "high"
  }
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/trackers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Tracker",
    "description": "Track new items",
    "type": "task"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Tracker created successfully",
  "data": {
    "id": "2",
    "name": "New Tracker",
    "description": "Track new items",
    "type": "task",
    "status": "active",
    "createdAt": "2025-09-01T11:00:00Z"
  }
}
```

### Update Tracker
```http
PUT /api/trackers/:id
```

**Request Body:**
```json
{
  "name": "Updated Tracker Name",
  "description": "Updated description",
  "status": "completed"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3000/api/trackers/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Tracker",
    "status": "completed"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Tracker updated successfully",
  "data": {
    "id": "1",
    "name": "Updated Tracker",
    "description": "Track project progress",
    "status": "completed",
    "updatedAt": "2025-09-01T12:00:00Z"
  }
}
```

### Delete Tracker
```http
DELETE /api/trackers/:id
```

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/trackers/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Tracker deleted successfully"
}
```

## 📈 Statistics Endpoints

### Get Statistics
```http
GET /api/stats
```

**Query Parameters:**
- `from` (optional): Start date (ISO 8601 format)
- `to` (optional): End date (ISO 8601 format)
- `groupBy` (optional): day/week/month/year

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/stats?from=2025-01-01&to=2025-09-01&groupBy=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrackers": 25,
    "activeTrackers": 18,
    "completedTrackers": 7,
    "timeline": [
      {
        "date": "2025-01",
        "count": 5
      },
      {
        "date": "2025-02",
        "count": 8
      }
    ]
  }
}
```

## 🧪 Testing Tools

### Using cURL
```bash
# GET request
curl -X GET "http://localhost:3000/api/trackers" \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST request with JSON data
curl -X POST "http://localhost:3000/api/trackers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tracker","description":"Test"}'
```

### Using HTTPie
```bash
# GET request
http GET localhost:3000/api/trackers \
  Authorization:"Bearer YOUR_TOKEN"

# POST request
http POST localhost:3000/api/trackers \
  Authorization:"Bearer YOUR_TOKEN" \
  name="Test Tracker" \
  description="Test"
```

### Using Postman

1. **Import Collection:**
   - Create a new collection named "Tracker API"
   - Set collection variables:
     - `baseUrl`: `http://localhost:3000/api`
     - `token`: Your authentication token

2. **Environment Setup:**
   ```json
   {
     "baseUrl": "http://localhost:3000/api",
     "token": "YOUR_TOKEN_HERE"
   }
   ```

3. **Request Configuration:**
   - URL: `{{baseUrl}}/trackers`
   - Headers:
     - Authorization: `Bearer {{token}}`
     - Content-Type: `application/json`

### Using JavaScript (Fetch API)
```javascript
// GET Request
async function getTrackers() {
  const response = await fetch('http://localhost:3000/api/trackers', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data);
}

// POST Request
async function createTracker() {
  const response = await fetch('http://localhost:3000/api/trackers', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'New Tracker',
      description: 'Test tracker'
    })
  });
  const data = await response.json();
  console.log(data);
}
```

### Using Python (requests)
```python
import requests

# Configuration
BASE_URL = "http://localhost:3000/api"
TOKEN = "YOUR_TOKEN"
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# GET Request
response = requests.get(f"{BASE_URL}/trackers", headers=headers)
print(response.json())

# POST Request
data = {
    "name": "New Tracker",
    "description": "Test tracker"
}
response = requests.post(f"{BASE_URL}/trackers", json=data, headers=headers)
print(response.json())
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
  "message": "Tracker with ID 999 not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 📝 Testing Checklist

### Basic Functionality
- [ ] Test user registration
- [ ] Test user login
- [ ] Test token authentication
- [ ] Test creating a tracker
- [ ] Test retrieving all trackers
- [ ] Test retrieving single tracker
- [ ] Test updating a tracker
- [ ] Test deleting a tracker

### Edge Cases
- [ ] Test with invalid token
- [ ] Test with missing required fields
- [ ] Test with invalid data types
- [ ] Test pagination limits
- [ ] Test sorting options
- [ ] Test filtering options
- [ ] Test concurrent requests
- [ ] Test rate limiting

### Performance Testing
- [ ] Test response times
- [ ] Test with large datasets
- [ ] Test concurrent users
- [ ] Test database connection limits

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints:** 5 requests per minute
- **GET endpoints:** 100 requests per minute
- **POST/PUT/DELETE endpoints:** 30 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693526400
```

## 📚 Additional Resources

- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [JSON API Specification](https://jsonapi.org/)
- [OAuth 2.0 Documentation](https://oauth.net/2/)

## 🤝 Support

For questions or issues, please:
1. Check the error message and status code
2. Verify your authentication token
3. Ensure correct request format
4. Review the API documentation
5. Create an issue in the GitHub repository

---

**Version:** 1.0.0  
**Last Updated:** September 2025