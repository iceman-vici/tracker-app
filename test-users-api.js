#!/usr/bin/env node

/**
 * Time Doctor Users API Test Script
 * Tests all the query parameters for the users endpoint
 * Usage: node test-users-api.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api/1.0';
let authToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Login to get token
async function login() {
  console.log(`${colors.cyan}Getting authentication token...${colors.reset}`);
  
  const response = await makeRequest('POST', '/login', {
    email: 'admin@example.com',
    password: 'password123'
  });

  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Login failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test basic users endpoint
async function testBasicUsers() {
  console.log(`${colors.cyan}Testing basic users endpoint...${colors.reset}`);
  
  const response = await makeRequest('GET', '/users', null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Basic users request successful${colors.reset}`);
    console.log(`  Found ${response.data.data ? response.data.data.length : 0} users`);
    console.log(`  Total: ${response.data.meta ? response.data.meta.total : 'N/A'}`);
    return response.data;
  } else {
    console.log(`${colors.red}✗ Basic users request failed${colors.reset}`);
    console.log(response.data);
    return null;
  }
}

// Test users with pagination
async function testUsersPagination() {
  console.log(`${colors.cyan}Testing users with pagination...${colors.reset}`);
  
  const query = new URLSearchParams({
    page: '1',
    limit: '5',
    sort: 'email'
  }).toString();
  
  const response = await makeRequest('GET', `/users?${query}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Paginated users request successful${colors.reset}`);
    console.log(`  Page: ${response.data.meta.page}`);
    console.log(`  Limit: ${response.data.meta.limit}`);
    console.log(`  Count: ${response.data.meta.count}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Paginated users request failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test users with filters
async function testUsersFilters() {
  console.log(`${colors.cyan}Testing users with filters...${colors.reset}`);
  
  const query = new URLSearchParams({
    'filter[role]': 'admin',
    'filter[email]': 'admin',
    detail: 'full'
  }).toString();
  
  const response = await makeRequest('GET', `/users?${query}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Filtered users request successful${colors.reset}`);
    console.log(`  Filtered results: ${response.data.data ? response.data.data.length : 0}`);
    if (response.data.data && response.data.data[0]) {
      console.log(`  First user role: ${response.data.data[0].role}`);
    }
    return true;
  } else {
    console.log(`${colors.red}✗ Filtered users request failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test self user endpoint
async function testSelfUser() {
  console.log(`${colors.cyan}Testing self user endpoint...${colors.reset}`);
  
  const query = new URLSearchParams({
    self: 'true',
    detail: 'full'
  }).toString();
  
  const response = await makeRequest('GET', `/users?${query}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Self user request successful${colors.reset}`);
    if (response.data.data && response.data.data[0]) {
      console.log(`  Current user: ${response.data.data[0].email}`);
      console.log(`  Role: ${response.data.data[0].role}`);
    }
    return true;
  } else {
    console.log(`${colors.red}✗ Self user request failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test users/me endpoint
async function testUsersMe() {
  console.log(`${colors.cyan}Testing /users/me endpoint...${colors.reset}`);
  
  const response = await makeRequest('GET', '/users/me', null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Users/me request successful${colors.reset}`);
    if (response.data.data) {
      console.log(`  User: ${response.data.data.email}`);
      console.log(`  Full name: ${response.data.data.full_name}`);
    }
    return true;
  } else {
    console.log(`${colors.red}✗ Users/me request failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test comprehensive Time Doctor query parameters
async function testTimeDocterQuery() {
  console.log(`${colors.cyan}Testing comprehensive Time Doctor query parameters...${colors.reset}`);
  
  const query = new URLSearchParams({
    company: 'company_123',
    detail: 'full',
    'task-project-names': 'true',
    'include-archived-users': 'false',
    deleted: 'false',
    page: '1',
    limit: '10',
    sort: 'name',
    'filter[role]': 'user',
    'filter[showOnReports]': 'true',
    'filter[inviteAccepted]': 'true',
    'filter[payrollAccess]': 'false'
  }).toString();
  
  const response = await makeRequest('GET', `/users?${query}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Comprehensive query successful${colors.reset}`);
    console.log(`  Results: ${response.data.data ? response.data.data.length : 0}`);
    console.log(`  Task-project-names: ${response.data.task_project_names ? 'included' : 'not included'}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Comprehensive query failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test all keyword search
async function testKeywordSearch() {
  console.log(`${colors.cyan}Testing keyword search...${colors.reset}`);
  
  const query = new URLSearchParams({
    'filter[keywords]': 'admin',
    detail: 'full'
  }).toString();
  
  const response = await makeRequest('GET', `/users?${query}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Keyword search successful${colors.reset}`);
    console.log(`  Found: ${response.data.data ? response.data.data.length : 0} users matching 'admin'`);
    return true;
  } else {
    console.log(`${colors.red}✗ Keyword search failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Test get specific user by ID
async function testSpecificUser() {
  console.log(`${colors.cyan}Testing get specific user by ID...${colors.reset}`);
  
  // First get users to find a valid ID
  const usersResponse = await makeRequest('GET', '/users?limit=1', null, authToken);
  if (!usersResponse.data.data || usersResponse.data.data.length === 0) {
    console.log(`${colors.yellow}⚠ No users found to test specific user endpoint${colors.reset}`);
    return true;
  }
  
  const userId = usersResponse.data.data[0].id;
  const response = await makeRequest('GET', `/users/${userId}`, null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Specific user request successful${colors.reset}`);
    console.log(`  User ID: ${response.data.data.id}`);
    console.log(`  Email: ${response.data.data.email}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Specific user request failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Main test runner
async function runUsersTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Time Doctor Users API Test Suite${colors.reset}`);
  console.log(`${colors.blue}API Base URL: ${API_BASE}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  let testsRun = 0;
  let testsPassed = 0;

  // Check if server is running
  try {
    await makeRequest('GET', '');
  } catch (error) {
    console.log(`${colors.red}❌ Server is not running!${colors.reset}`);
    console.log(`${colors.yellow}Please start the server with: npm start${colors.reset}`);
    process.exit(1);
  }

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log(`${colors.red}❌ Cannot proceed without authentication${colors.reset}`);
    process.exit(1);
  }
  console.log('');

  // Run tests
  const tests = [
    { name: 'Basic Users', fn: testBasicUsers },
    { name: 'Users Pagination', fn: testUsersPagination },
    { name: 'Users Filters', fn: testUsersFilters },
    { name: 'Self User', fn: testSelfUser },
    { name: 'Users/Me', fn: testUsersMe },
    { name: 'Time Doctor Query', fn: testTimeDocterQuery },
    { name: 'Keyword Search', fn: testKeywordSearch },
    { name: 'Specific User', fn: testSpecificUser }
  ];

  for (const test of tests) {
    testsRun++;
    try {
      const result = await test.fn();
      if (result || result === true) {
        testsPassed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ ${test.name} threw an error: ${error.message}${colors.reset}`);
    }
    console.log('');
  }

  // Summary
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Users API Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  const passRate = (testsPassed / testsRun * 100).toFixed(1);
  const summaryColor = testsPassed === testsRun ? colors.green : 
                       testsPassed > testsRun / 2 ? colors.yellow : colors.red;
  
  console.log(`${summaryColor}Passed: ${testsPassed}/${testsRun} (${passRate}%)${colors.reset}`);
  
  if (testsPassed === testsRun) {
    console.log(`${colors.green}✅ All users API tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Check the output above.${colors.reset}`);
  }

  console.log(`\n${colors.cyan}Sample cURL commands:${colors.reset}`);
  console.log(`${colors.yellow}# Get all users${colors.reset}`);
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${API_BASE}/users"`);
  console.log(`${colors.yellow}# Get users with filters${colors.reset}`);
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${API_BASE}/users?filter[role]=admin&detail=full"`);
  console.log(`${colors.yellow}# Get current user${colors.reset}`);
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" "${API_BASE}/users/me"`);
}

// Run the tests
runUsersTests().catch(console.error);