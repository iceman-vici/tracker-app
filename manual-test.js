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
      if (response.data.data && response.data.data.token) {
        token = response.data.data.token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.data.token`);
      } else if (response.data.token) {
        token = response.data.token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.token`);
      } else if (response.data.access_token) {
        token = response.data.access_token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.access_token`);
      } else if (response.data.auth_token) {
        token = response.data.auth_token;
        console.log(`${colors.green}[TOKEN LOCATION]${colors.reset} Found in response.data.auth_token`);
      }

      if (token) {
        console.log(`\n${colors.bright}${colors.green}🎫 TOKEN EXTRACTED SUCCESSFULLY${colors.reset}`);
        console.log(`${colors.bright}${colors.yellow}Token: ${token}${colors.reset}`);
        console.log(`\n${colors.cyan}[TOKEN INFO]${colors.reset}`);
        console.log(`Expires At: ${response.data.data?.expiresAt || 'Not specified'}`);
        console.log(`Created At: ${response.data.data?.createdAt || 'Not specified'}`);
        console.log(`API Version: ${response.data.api || 'Not specified'}`);
        
        // Store user info if available
        const userInfo = response.data.user || response.data.data?.user || {};
        
        return { token, userInfo, fullResponse: response.data };
      } else {
        console.log(`\n${colors.red}❌ TOKEN NOT FOUND IN RESPONSE${colors.reset}`);
        console.log(`${colors.yellow}[DEBUG INFO]${colors.reset} Check the full response structure above`);
        
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

// Step 2: Test Users Endpoint with different authentication methods
async function testUsersEndpoint(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 2: TEST USERS ENDPOINT`);
  console.log(`===========================================${colors.reset}\n`);

  if (!token) {
    console.log(`${colors.red}❌ Cannot test users endpoint - no token available${colors.reset}`);
    return;
  }

  // Try Method 1: Bearer Token in Authorization header
  console.log(`\n${colors.cyan}[METHOD 1: Bearer Token]${colors.reset}`);
  let options = {
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
    let response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ METHOD 1 SUCCESSFUL - Bearer Token works!${colors.reset}`);
      displayUsers(response.data);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ METHOD 1 FAILED - Bearer token rejected${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ METHOD 1 REQUEST FAILED${colors.reset}`, error);
  }

  // Try Method 2: Token without Bearer prefix
  console.log(`\n${colors.cyan}[METHOD 2: Token without Bearer prefix]${colors.reset}`);
  options.headers.Authorization = token;
  
  try {
    let response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ METHOD 2 SUCCESSFUL - Plain token works!${colors.reset}`);
      displayUsers(response.data);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ METHOD 2 FAILED - Plain token rejected${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ METHOD 2 REQUEST FAILED${colors.reset}`, error);
  }

  // Try Method 3: Token in X-Access-Token header
  console.log(`\n${colors.cyan}[METHOD 3: X-Access-Token header]${colors.reset}`);
  options.headers = {
    'X-Access-Token': token,
    'Accept': 'application/json'
  };
  
  try {
    let response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ METHOD 3 SUCCESSFUL - X-Access-Token works!${colors.reset}`);
      displayUsers(response.data);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ METHOD 3 FAILED - X-Access-Token rejected${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ METHOD 3 REQUEST FAILED${colors.reset}`, error);
  }

  // Try Method 4: Token as query parameter
  console.log(`\n${colors.cyan}[METHOD 4: Token as query parameter]${colors.reset}`);
  options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `${API_VERSION}/users?token=${token}&detail=full&limit=5`,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };
  
  try {
    let response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ METHOD 4 SUCCESSFUL - Query parameter works!${colors.reset}`);
      displayUsers(response.data);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ METHOD 4 FAILED - Query parameter rejected${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ METHOD 4 REQUEST FAILED${colors.reset}`, error);
  }

  // Try Method 5: API Key header
  console.log(`\n${colors.cyan}[METHOD 5: Api-Key header]${colors.reset}`);
  options.headers = {
    'Api-Key': token,
    'Accept': 'application/json'
  };
  options.path = `${API_VERSION}/users?detail=full&limit=5`;
  
  try {
    let response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ METHOD 5 SUCCESSFUL - Api-Key header works!${colors.reset}`);
      displayUsers(response.data);
      return true;
    } else if (response.statusCode === 401) {
      console.log(`\n${colors.red}❌ METHOD 5 FAILED - Api-Key header rejected${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ METHOD 5 REQUEST FAILED${colors.reset}`, error);
  }

  console.log(`\n${colors.red}${colors.bright}❌ ALL AUTHENTICATION METHODS FAILED${colors.reset}`);
  console.log(`\n${colors.yellow}[TROUBLESHOOTING]${colors.reset}`);
  console.log(`1. The token might need to be used with a different API endpoint`);
  console.log(`2. There might be a company/organization ID required`);
  console.log(`3. The token might need additional activation`);
  console.log(`4. Check Time Doctor's API documentation for specific requirements`);
  
  return false;
}

// Helper function to display users
function displayUsers(data) {
  if (data.data && Array.isArray(data.data)) {
    console.log(`\n${colors.cyan}[USER COUNT]${colors.reset} ${data.data.length} users found`);
    
    data.data.forEach((user, index) => {
      console.log(`\n${colors.magenta}[USER ${index + 1}]${colors.reset}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name || user.full_name || 'N/A'}`);
      console.log(`  Role: ${user.role || 'N/A'}`);
      console.log(`  Status: ${user.status || 'N/A'}`);
    });
  }
}

// Step 3: Test Me Endpoint (current user)
async function testMeEndpoint(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 3: TEST ME ENDPOINT (Current User)`);
  console.log(`===========================================${colors.reset}\n`);

  if (!token) {
    console.log(`${colors.red}❌ Cannot test me endpoint - no token available${colors.reset}`);
    return;
  }

  const options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `${API_VERSION}/me`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`\n${colors.green}${colors.bright}✅ ME ENDPOINT SUCCESSFUL!${colors.reset}`);
      console.log(`\n${colors.cyan}[CURRENT USER INFO]${colors.reset}`);
      if (response.data.data) {
        const user = response.data.data;
        console.log(`  ID: ${user.id || 'N/A'}`);
        console.log(`  Email: ${user.email || 'N/A'}`);
        console.log(`  Name: ${user.name || user.full_name || 'N/A'}`);
        console.log(`  Company: ${user.company_id || 'N/A'}`);
      }
      return response.data.data;
    } else {
      console.log(`\n${colors.red}❌ ME ENDPOINT FAILED WITH STATUS ${response.statusCode}${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ ME ENDPOINT REQUEST FAILED${colors.reset}`, error);
  }
  
  return null;
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
    console.log(`\n${colors.yellow}[ALTERNATIVE]${colors.reset} Get token from Time Doctor directly:`);
    console.log(`1. Log in to https://webapi.timedoctor.com`);
    console.log(`2. Go to API documentation or developer section`);
    console.log(`3. Get your API token`);
    console.log(`4. Use it in manual-test.js`);
    console.log(`\n${colors.red}Continuing with placeholder values...${colors.reset}\n`);
  }

  // Step 1: Login
  const loginResult = await login();
  
  if (loginResult.token) {
    // Step 2: Test Me Endpoint first (might work better)
    const currentUser = await testMeEndpoint(loginResult.token);
    
    // Step 3: Test Users Endpoint with various methods
    const usersWorking = await testUsersEndpoint(loginResult.token);
    
    // Summary
    console.log(`\n${colors.bright}${colors.magenta}===========================================`);
    console.log(`SUMMARY`);
    console.log(`===========================================${colors.reset}`);
    
    if (usersWorking) {
      console.log(`\n${colors.green}✅ Authentication working! Token successfully used${colors.reset}`);
      console.log(`\n${colors.cyan}[FOR MANUAL TESTING]${colors.reset}`);
      console.log(`Token: ${loginResult.token}`);
      
      console.log(`\n${colors.cyan}[EXAMPLE CURL COMMANDS]${colors.reset}`);
      console.log(`\n# Get users:`);
      console.log(`curl -H "Authorization: Bearer ${loginResult.token}" \\`);
      console.log(`     "https://api2.timedoctor.com/api/1.0/users?detail=full"`);
      
      console.log(`\n# Get current user:`);
      console.log(`curl -H "Authorization: Bearer ${loginResult.token}" \\`);
      console.log(`     "https://api2.timedoctor.com/api/1.0/me"`);
    } else {
      console.log(`\n${colors.yellow}⚠️  Token obtained but authentication not working${colors.reset}`);
      console.log(`\n${colors.cyan}[IMPORTANT NOTE]${colors.reset}`);
      console.log(`The token format from Time Doctor v1.3 auth might not be compatible`);
      console.log(`with the v1.0 API endpoints.`);
      console.log(`\n${colors.cyan}[RECOMMENDED NEXT STEPS]${colors.reset}`);
      console.log(`1. Check Time Doctor's API documentation for the correct auth flow`);
      console.log(`2. You might need to use a different login endpoint`);
      console.log(`3. There might be a company/workspace selection step required`);
      console.log(`4. Contact Time Doctor support for API access details`);
      console.log(`\n${colors.cyan}[TOKEN FOR REFERENCE]${colors.reset}`);
      console.log(`${loginResult.token}`);
    }
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
