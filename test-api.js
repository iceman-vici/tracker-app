#!/usr/bin/env node

/**
 * Time Tracker API Test Script
 * Tests against Time Doctor Production API
 * Usage: node test-api.js
 */

const https = require('https');
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');
const apiConfig = require('./src/config/apiConfig');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Time Doctor API Test Suite${colors.reset}`);
  console.log(`${colors.blue}API URL: ${apiConfig.getCurrentEndpoint().baseURL}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

  // Create client
  const client = new TimeDocktorClient({
    baseURL: apiConfig.getCurrentEndpoint().baseURL,
    debug: true
  });

  let testsRun = 0;
  let testsPassed = 0;

  // Check if credentials are configured
  const credentials = apiConfig.getCredentials();
  if (!credentials.email || !credentials.password) {
    console.log(`${colors.red}❌ Time Doctor credentials not configured!${colors.reset}`);
    console.log(`${colors.yellow}Please set TIMEDOCTOR_EMAIL and TIMEDOCTOR_PASSWORD in your .env file${colors.reset}`);
    process.exit(1);
  }

  // Test 1: Login
  console.log(`${colors.cyan}Testing LOGIN...${colors.reset}`);
  testsRun++;
  try {
    const loginResponse = await client.simpleLogin(credentials.email, credentials.password);
    if (loginResponse.data && loginResponse.data.token) {
      console.log(`${colors.green}✓ Login successful${colors.reset}`);
      console.log(`  Token: ${loginResponse.data.token.substring(0, 20)}...`);
      testsPassed++;
    } else {
      console.log(`${colors.red}✗ Login failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Login failed: ${error.message}${colors.reset}`);
  }
  console.log('');

  // Test 2: Get Users
  console.log(`${colors.cyan}Testing GET USERS...${colors.reset}`);
  testsRun++;
  try {
    const users = await client.getUsers();
    const userCount = users.data ? users.data.length : users.length || 0;
    console.log(`${colors.green}✓ Get users successful${colors.reset}`);
    console.log(`  Found ${userCount} users`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Get users failed: ${error.message}${colors.reset}`);
  }
  console.log('');

  // Test 3: Get Projects
  console.log(`${colors.cyan}Testing GET PROJECTS...${colors.reset}`);
  testsRun++;
  try {
    const projects = await client.getProjects();
    const projectCount = projects.data ? projects.data.length : projects.length || 0;
    console.log(`${colors.green}✓ Get projects successful${colors.reset}`);
    console.log(`  Found ${projectCount} projects`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Get projects failed: ${error.message}${colors.reset}`);
  }
  console.log('');

  // Test 4: Get Tasks
  console.log(`${colors.cyan}Testing GET TASKS...${colors.reset}`);
  testsRun++;
  try {
    const tasks = await client.getTasks();
    const taskCount = tasks.data ? tasks.data.length : tasks.length || 0;
    console.log(`${colors.green}✓ Get tasks successful${colors.reset}`);
    console.log(`  Found ${taskCount} tasks`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Get tasks failed: ${error.message}${colors.reset}`);
  }
  console.log('');

  // Test 5: Get Worklogs
  console.log(`${colors.cyan}Testing GET WORKLOGS...${colors.reset}`);
  testsRun++;
  try {
    const worklogs = await client.getWorklogs();
    const worklogCount = worklogs.total || (worklogs.data ? worklogs.data.length : 0) || 0;
    console.log(`${colors.green}✓ Get worklogs successful${colors.reset}`);
    console.log(`  Found ${worklogCount} worklogs`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Get worklogs failed: ${error.message}${colors.reset}`);
  }
  console.log('');

  // Test 6: Get Companies
  console.log(`${colors.cyan}Testing GET COMPANIES...${colors.reset}`);
  testsRun++;
  try {
    const companies = await client.getCompanies();
    const companyCount = companies.data ? companies.data.length : companies.length || 0;
    console.log(`${colors.green}✓ Get companies successful${colors.reset}`);
    console.log(`  Found ${companyCount} companies`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Get companies failed: ${error.message}${colors.reset}`);
  }
  console.log('');

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