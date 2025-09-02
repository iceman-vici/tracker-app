#!/usr/bin/env node

/**
 * Time Tracker API Test Script
 * Run this script to test the API endpoints
 * Usage: node test-api.js
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

// Test functions
async function testLogin() {
  console.log(`${colors.cyan}Testing LOGIN endpoint...${colors.reset}`);
  
  const response = await makeRequest('POST', '/login', {
    email: 'admin@example.com',
    password: 'password123'
  });

  if (response.status === 200 && response.data.token) {
    authToken = response.data.token;
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    console.log(`  Token: ${authToken.substring(0, 20)}...`);
    console.log(`  User: ${response.data.user.email}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Login failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

async function testRegister() {
  console.log(`${colors.cyan}Testing REGISTER endpoint...${colors.reset}`);
  
  const timestamp = Date.now();
  const response = await makeRequest('POST', '/register', {
    email: `test${timestamp}@example.com`,
    password: 'password123',
    username: `user${timestamp}`,
    first_name: 'Test',
    last_name: 'User'
  });

  if (response.status === 201 && response.data.token) {
    console.log(`${colors.green}✓ Registration successful${colors.reset}`);
    console.log(`  New user: test${timestamp}@example.com`);
    return true;
  } else if (response.status === 400) {
    console.log(`${colors.yellow}⚠ User might already exist${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Registration failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

async function testGetUsers() {
  console.log(`${colors.cyan}Testing GET USERS endpoint...${colors.reset}`);
  
  const response = await makeRequest('GET', '/users', null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Get users successful${colors.reset}`);
    console.log(`  Found ${response.data.data ? response.data.data.length : 0} users`);
    return true;
  } else {
    console.log(`${colors.red}✗ Get users failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

async function testCreateProject() {
  console.log(`${colors.cyan}Testing CREATE PROJECT endpoint...${colors.reset}`);
  
  const response = await makeRequest('POST', '/projects', {
    name: `Test Project ${Date.now()}`,
    description: 'API test project',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, authToken);

  if (response.status === 201) {
    console.log(`${colors.green}✓ Project created successfully${colors.reset}`);
    console.log(`  Project ID: ${response.data.data._id}`);
    return response.data.data._id;
  } else {
    console.log(`${colors.red}✗ Project creation failed${colors.reset}`);
    console.log(response.data);
    return null;
  }
}

async function testCreateTask(projectId) {
  console.log(`${colors.cyan}Testing CREATE TASK endpoint...${colors.reset}`);
  
  const response = await makeRequest('POST', '/tasks', {
    title: `Test Task ${Date.now()}`,
    description: 'API test task',
    projectId: projectId || 'test_project',
    priority: 'high'
  }, authToken);

  if (response.status === 201) {
    console.log(`${colors.green}✓ Task created successfully${colors.reset}`);
    console.log(`  Task ID: ${response.data.data._id}`);
    return response.data.data._id;
  } else {
    console.log(`${colors.red}✗ Task creation failed${colors.reset}`);
    console.log(response.data);
    return null;
  }
}

async function testCreateWorklog(projectId, taskId) {
  console.log(`${colors.cyan}Testing CREATE WORKLOG endpoint...${colors.reset}`);
  
  const response = await makeRequest('POST', '/worklogs', {
    project_id: projectId || 'test_project',
    task_id: taskId || 'test_task',
    description: 'Working on API testing',
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
    duration: 3600,
    keyboard_strokes: 1234,
    mouse_clicks: 567
  }, authToken);

  if (response.status === 201) {
    console.log(`${colors.green}✓ Worklog created successfully${colors.reset}`);
    console.log(`  Worklog ID: ${response.data.data.id}`);
    console.log(`  Duration: ${response.data.data.duration} seconds`);
    return response.data.data.id;
  } else {
    console.log(`${colors.red}✗ Worklog creation failed${colors.reset}`);
    console.log(response.data);
    return null;
  }
}

async function testGetWorklogs() {
  console.log(`${colors.cyan}Testing GET WORKLOGS endpoint...${colors.reset}`);
  
  const response = await makeRequest('GET', '/worklogs', null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Get worklogs successful${colors.reset}`);
    console.log(`  Found ${response.data.total || 0} worklogs`);
    return true;
  } else {
    console.log(`${colors.red}✗ Get worklogs failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

async function testReports() {
  console.log(`${colors.cyan}Testing REPORTS endpoint...${colors.reset}`);
  
  const response = await makeRequest('GET', '/reports/summary', null, authToken);

  if (response.status === 200) {
    console.log(`${colors.green}✓ Get reports successful${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Get reports failed${colors.reset}`);
    console.log(response.data);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Time Tracker API Test Suite${colors.reset}`);
  console.log(`${colors.blue}API Base URL: ${API_BASE}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

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

  // Run tests
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Register', fn: testRegister },
    { name: 'Get Users', fn: testGetUsers },
    { name: 'Create Project', fn: testCreateProject },
    { name: 'Create Task', fn: async () => testCreateTask(null) },
    { name: 'Create Worklog', fn: async () => testCreateWorklog(null, null) },
    { name: 'Get Worklogs', fn: testGetWorklogs },
    { name: 'Reports', fn: testReports }
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
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  const passRate = (testsPassed / testsRun * 100).toFixed(1);
  const summaryColor = testsPassed === testsRun ? colors.green : 
                       testsPassed > testsRun / 2 ? colors.yellow : colors.red;
  
  console.log(`${summaryColor}Passed: ${testsPassed}/${testsRun} (${passRate}%)${colors.reset}`);
  
  if (testsPassed === testsRun) {
    console.log(`${colors.green}✅ All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Check the output above.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(console.error);
