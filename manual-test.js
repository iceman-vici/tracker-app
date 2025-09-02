#!/usr/bin/env node

/**
 * Time Doctor API Manual Test Script
 * 
 * This script helps debug Time Doctor API authentication and test API endpoints.
 * 
 * Usage:
 * 1. Set your credentials in .env file or as environment variables
 * 2. Run: node manual-test.js
 * 
 * The script will:
 * - Login to Time Doctor API
 * - Extract and display the token
 * - Test the users endpoint with proper Bearer authentication
 */

const https = require('https');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'https://api2.timedoctor.com';
const API_VERSION = '/api/1.0';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.cyan}[REQUEST]${colors.reset} ${options.method} ${options.path}`);
    console.log(`${colors.cyan}[HEADERS]${colors.reset}`, JSON.stringify(options.headers, null, 2));
    
    if (data) {
      console.log(`${colors.cyan}[BODY]${colors.reset}`, JSON.stringify(data, null, 2));
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n${colors.yellow}[RESPONSE STATUS]${colors.reset} ${res.statusCode}`);
        console.log(`${colors.yellow}[RESPONSE HEADERS]${colors.reset}`, JSON.stringify(res.headers, null, 2));
        
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`${colors.green}[RESPONSE BODY]${colors.reset}`, JSON.stringify(parsedData, null, 2));
          resolve({ statusCode: res.statusCode, data: parsedData, headers: res.headers });
        } catch (error) {
          console.log(`${colors.red}[RAW RESPONSE]${colors.reset}`, responseData);
          resolve({ statusCode: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`${colors.red}[ERROR]${colors.reset}`, error);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Step 1: Login to Time Doctor
async function login() {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 1: LOGIN TO TIME DOCTOR`);
  console.log(`===========================================${colors.reset}\n`);

  const loginData = {
    email: process.env.TIME_DOCTOR_EMAIL || 'your-email@example.com',
    password: process.env.TIME_DOCTOR_PASSWORD || 'your-password',
    permissions: 'write'
  };

  // Add TOTP code if provided
  if (process.env.TIME_DOCTOR_TOTP) {
    loginData.totpCode = process.env.TIME_DOCTOR_TOTP;
  }

  console.log(`${colors.magenta}[LOGIN CREDENTIALS]${colors.reset}`);
  console.log(`Email: ${loginData.email}`);
  console.log(`Password: ${loginData.password.replace(/./g, '*')}`);
  console.log(`Permissions: ${loginData.permissions}`);
  if (loginData.totpCode) {
    console.log(`TOTP Code: ${loginData.totpCode}`);
  }

  const options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `${API_VERSION}/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log(`\n${colors.green}${colors.bright}✅ LOGIN SUCCESSFUL!${colors.reset}`);
      
      // Extract token - Time Doctor API returns it in different possible locations
      let token = null;
      
      // Check in response data
      if (response.data.token) {
        token = response.data.token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.token`);
      } else if (response.data.data && response.data.data.token) {
        token = response.data.data.token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.data.token`);
      } else if (response.data.access_token) {
        token = response.data.access_token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.access_token`);
      } else if (response.data.auth_token) {
        token = response.data.auth_token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.auth_token`);
      }

      if (token) {
        console.log(`\n${colors.bright}${colors.green}🎫 TOKEN EXTRACTED SUCCESSFULLY${colors.reset}`);
        console.log(`${colors.bright}${colors.yellow}Bearer ${token}${colors.reset}`);
        console.log(`\n${colors.cyan}[COPY THIS FOR MANUAL TESTING]${colors.reset}`);
        console.log(`Authorization: Bearer ${token}`);
        
        // Store user info if available
        const userInfo = response.data.user || response.data.data?.user || {};
        
        return { token, userInfo, fullResponse: response.data };
      } else {
        console.log(`\n${colors.red}❌ TOKEN NOT FOUND IN RESPONSE${colors.reset}`);
        console.log(`${colors.yellow}[DEBUG INFO]${colors.reset} Check the full response structure above`);
        console.log(`${colors.yellow}[POSSIBLE ISSUES]${colors.reset}`);
        console.log(`1. API might return token in a different field`);
        console.log(`2. Credentials might be incorrect`);
        console.log(`3. API might require additional parameters`);
        
        return { token: null, userInfo: {}, fullResponse: response.data };
      }
    } else {
      console.log(`\n${colors.red}❌ LOGIN FAILED WITH STATUS ${response.statusCode}${colors.reset}`);
      console.log(`${colors.yellow}[ERROR DETAILS]${colors.reset}`, response.data);
      
      return { token: null, userInfo: {}, fullResponse: response.data };
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ LOGIN REQUEST FAILED${colors.reset}`, error);
    return { token: null, userInfo: {}, fullResponse: null };
  }
}

// Step 2: Test Users Endpoint
async function testUsersEndpoint(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 2: TEST USERS ENDPOINT`);
  console.log(`===========================================${colors.reset}\n`);

  if (!token) {
    console.log(`${colors.red}❌ Cannot test users endpoint - no token available${colors.reset}`);
    return;
  }

  const options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `${API_VERSION}/users?detail=full&limit=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ USERS ENDPOINT TEST SUCCESSFUL!${colors.reset}`);
      
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`\n${colors.cyan}[USER COUNT]${colors.reset} ${response.data.data.length} users found`);
        
        response.data.data.forEach((user, index) => {
          console.log(`\n${colors.magenta}[USER ${index + 1}]${colors.reset}`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Name: ${user.name || user.full_name || 'N/A'}`);
          console.log(`  Role: ${user.role || 'N/A'}`);
          console.log(`  Status: ${user.status || 'N/A'}`);
        });
      }
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ AUTHENTICATION FAILED${colors.reset}`);
      console.log(`${colors.yellow}[POSSIBLE ISSUES]${colors.reset}`);
      console.log(`1. Token might be expired`);
      console.log(`2. Bearer prefix might be missing`);
      console.log(`3. Token format might be incorrect`);
    } else {
      console.log(`\n${colors.red}❌ USERS ENDPOINT TEST FAILED WITH STATUS ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ USERS ENDPOINT REQUEST FAILED${colors.reset}`, error);
  }
}

// Step 3: Test Other Endpoints
async function testOtherEndpoints(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 3: TEST OTHER ENDPOINTS`);
  console.log(`===========================================${colors.reset}\n`);

  if (!token) {
    console.log(`${colors.red}❌ Cannot test other endpoints - no token available${colors.reset}`);
    return;
  }

  // Test projects endpoint
  console.log(`\n${colors.cyan}[TESTING PROJECTS ENDPOINT]${colors.reset}`);
  const projectsOptions = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `${API_VERSION}/projects?limit=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(projectsOptions);
    if (response.statusCode === 200) {
      console.log(`${colors.green}✅ Projects endpoint working${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Projects endpoint returned status ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Projects endpoint failed${colors.reset}`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log(`TIME DOCTOR API DEBUG SCRIPT`);
  console.log(`===========================================${colors.reset}`);
  console.log(`\n${colors.cyan}[CONFIGURATION]${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`API Version: ${API_VERSION}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Check for environment variables
  if (!process.env.TIME_DOCTOR_EMAIL || !process.env.TIME_DOCTOR_PASSWORD) {
    console.log(`\n${colors.yellow}⚠️  WARNING: Time Doctor credentials not found in environment variables${colors.reset}`);
    console.log(`${colors.cyan}[SETUP INSTRUCTIONS]${colors.reset}`);
    console.log(`1. Create a .env file in the project root`);
    console.log(`2. Add the following variables:`);
    console.log(`   TIME_DOCTOR_EMAIL=your-email@example.com`);
    console.log(`   TIME_DOCTOR_PASSWORD=your-password`);
    console.log(`   TIME_DOCTOR_TOTP=123456  # Optional: if 2FA is enabled`);
    console.log(`\n${colors.yellow}[ALTERNATIVE]${colors.reset} Set them as environment variables:`);
    console.log(`   export TIME_DOCTOR_EMAIL=your-email@example.com`);
    console.log(`   export TIME_DOCTOR_PASSWORD=your-password`);
    console.log(`\n${colors.red}Continuing with placeholder values...${colors.reset}\n`);
  }

  // Step 1: Login
  const loginResult = await login();
  
  // Step 2: Test Users Endpoint
  if (loginResult.token) {
    await testUsersEndpoint(loginResult.token);
    
    // Step 3: Test Other Endpoints
    await testOtherEndpoints(loginResult.token);
    
    // Summary
    console.log(`\n${colors.bright}${colors.magenta}===========================================`);
    console.log(`SUMMARY`);
    console.log(`===========================================${colors.reset}`);
    console.log(`\n${colors.green}✅ Token successfully extracted and used${colors.reset}`);
    console.log(`\n${colors.cyan}[FOR MANUAL TESTING]${colors.reset}`);
    console.log(`Use this header in your API requests:`);
    console.log(`${colors.yellow}Authorization: Bearer ${loginResult.token}${colors.reset}`);
    
    console.log(`\n${colors.cyan}[EXAMPLE CURL COMMAND]${colors.reset}`);
    console.log(`curl -H "Authorization: Bearer ${loginResult.token}" \\`);
    console.log(`     "https://api2.timedoctor.com/api/1.0/users?detail=full"`);
  } else {
    console.log(`\n${colors.bright}${colors.red}===========================================`);
    console.log(`AUTHENTICATION FAILED`);
    console.log(`===========================================${colors.reset}`);
    console.log(`\n${colors.yellow}[TROUBLESHOOTING STEPS]${colors.reset}`);
    console.log(`1. Verify your Time Doctor credentials are correct`);
    console.log(`2. Check if 2FA is enabled on your account (add TIME_DOCTOR_TOTP)`);
    console.log(`3. Ensure your account has API access enabled`);
    console.log(`4. Check Time Doctor API status at https://status.timedoctor.com`);
    console.log(`5. Review the full response structure above for clues`);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  process.exit(1);
});
