#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

/**
 * Debug version of Time Tracker API Test Script
 * This provides more detailed output to debug authentication issues
 * Usage: node test-api-debug.js
 */

const TimeDocktorClient = require('./src/clients/TimeDocktorClient');
const apiConfig = require('./src/config/apiConfig');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Main test runner
async function runDebugTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Time Doctor API Debug Test${colors.reset}`);
  console.log(`${colors.blue}API URL: ${apiConfig.getCurrentEndpoint().baseURL}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Create client with debug mode enabled
  const client = new TimeDocktorClient({
    baseURL: apiConfig.getCurrentEndpoint().baseURL,
    debug: true  // Enable debug mode for detailed output
  });

  // Check if credentials are configured
  const credentials = apiConfig.getCredentials();
  console.log(`${colors.cyan}Checking credentials...${colors.reset}`);
  console.log(`Email: ${credentials.email || 'NOT SET'}`);
  console.log(`Password: ${credentials.password ? '***' + credentials.password.slice(-4) : 'NOT SET'}`);
  console.log();

  if (!credentials.email || !credentials.password) {
    console.log(`${colors.red}❌ Time Doctor credentials not configured!${colors.reset}`);
    console.log(`${colors.yellow}Please set TIMEDOCTOR_EMAIL and TIMEDOCTOR_PASSWORD in your .env file${colors.reset}`);
    process.exit(1);
  }

  // Test 1: Login
  console.log(`${colors.cyan}Testing LOGIN...${colors.reset}`);
  try {
    console.log(`${colors.magenta}Attempting login with:${colors.reset}`);
    console.log(`  Email: ${credentials.email}`);
    console.log(`  Password: ***${credentials.password.slice(-4)}`);
    console.log();
    
    const loginResponse = await client.simpleLogin(credentials.email, credentials.password);
    
    console.log(`${colors.green}✓ Login request completed${colors.reset}`);
    console.log(`${colors.magenta}Response structure:${colors.reset}`);
    console.log(JSON.stringify(loginResponse, null, 2));
    console.log();
    
    // Check if token was saved
    const config = client.getConfig();
    console.log(`${colors.magenta}Client configuration after login:${colors.reset}`);
    console.log(`  Token: ${config.token || 'NOT SET'}`);
    console.log(`  Company ID: ${config.companyId || 'NOT SET'}`);
    console.log(`  User ID: ${config.userId || 'NOT SET'}`);
    console.log(`  Token Expiry: ${config.tokenExpiry || 'NOT SET'}`);
    console.log();
    
    if (client.token) {
      console.log(`${colors.green}✓ Token successfully saved in client${colors.reset}`);
      console.log(`  Full token: ${client.token}`);
    } else {
      console.log(`${colors.red}✗ No token found in client after login${colors.reset}`);
      console.log(`${colors.yellow}The login response may have a different structure than expected.${colors.reset}`);
      console.log(`${colors.yellow}You may need to manually set the token using:${colors.reset}`);
      console.log(`${colors.cyan}  client.setToken('your-token-here');${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Login failed with error:${colors.reset}`);
    console.log(error.message);
    console.log();
    console.log(`${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log('1. Check your credentials are correct');
    console.log('2. Try logging in at https://webapi.timedoctor.com to verify credentials');
    console.log('3. Check if 2FA is enabled on your account');
    console.log('4. Ensure your account has API access');
    process.exit(1);
  }
  
  console.log();
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  
  // Test 2: Try to get users (will test if token works)
  if (client.token) {
    console.log(`${colors.cyan}Testing GET USERS with token...${colors.reset}`);
    try {
      const users = await client.getUsers();
      console.log(`${colors.green}✓ Successfully fetched users${colors.reset}`);
      console.log(`  Response:`, JSON.stringify(users, null, 2).substring(0, 500));
    } catch (error) {
      console.log(`${colors.red}✗ Failed to fetch users:${colors.reset}`);
      console.log(error.message);
      console.log();
      console.log(`${colors.yellow}This suggests the token format or authorization method may be incorrect.${colors.reset}`);
    }
  }
  
  console.log();
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Debug test completed${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
}

// Run the debug tests
runDebugTests().catch(console.error);