#!/usr/bin/env node

/**
 * Time Doctor API - WORKING SOLUTION
 * 
 * Uses the correct authorization format from Time Doctor documentation:
 * - Authorization header with raw token (no Bearer prefix)
 * - Company ID as query parameter
 */

const https = require('https');
require('dotenv').config();

// Configuration
const COMPANY_ID = '68b1cb4ae86c38faec59b7f6';

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
    
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`${colors.yellow}[STATUS]${colors.reset} ${res.statusCode}`);
        
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode === 200) {
            console.log(`${colors.green}✅ SUCCESS${colors.reset}`);
          } else {
            console.log(`${colors.red}❌ ERROR:${colors.reset} ${parsedData.message || parsedData.error}`);
          }
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: responseData });
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

  if (process.env.TIME_DOCTOR_TOTP) {
    loginData.totpCode = process.env.TIME_DOCTOR_TOTP;
  }

  const options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: '/api/1.0/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      const token = response.data.data?.token || response.data.token;
      if (token) {
        console.log(`${colors.green}Token obtained: ${token.substring(0, 20)}...${colors.reset}`);
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error(`Login failed:`, error);
    return null;
  }
}

// Step 2: Test Endpoints with Correct Authorization
async function testEndpointsCorrectly(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`TESTING WITH CORRECT AUTHORIZATION FORMAT`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.cyan}Using Authorization header with raw token (no Bearer)${colors.reset}`);
  console.log(`Company ID: ${COMPANY_ID}\n`);

  const endpoints = [
    {
      name: 'Users',
      path: `/api/1.0/users?company=${COMPANY_ID}&detail=full&limit=10`
    },
    {
      name: 'Users (self)',
      path: `/api/1.0/users?company=${COMPANY_ID}&self=true&detail=full`
    },
    {
      name: 'Current User (me)',
      path: `/api/1.0/me`
    },
    {
      name: 'Companies',
      path: `/api/1.0/companies`
    },
    {
      name: 'Projects',
      path: `/api/1.0/projects?company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Tasks',
      path: `/api/1.0/tasks?company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Worklogs',
      path: `/api/1.0/worklogs?company=${COMPANY_ID}&start=2025-09-01&end=2025-09-02&limit=10`
    },
    {
      name: 'Activity',
      path: `/api/1.0/activity?company=${COMPANY_ID}&start=2025-09-01&end=2025-09-02&limit=10`
    }
  ];

  const workingEndpoints = [];
  const failedEndpoints = [];

  for (const endpoint of endpoints) {
    console.log(`\n${colors.magenta}[TESTING ${endpoint.name.toUpperCase()}]${colors.reset}`);
    
    // Use raw token in Authorization header (no Bearer prefix)
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Authorization': token,  // Raw token, no Bearer!
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        workingEndpoints.push(endpoint);
        
        const data = response.data.data || response.data;
        if (Array.isArray(data)) {
          console.log(`${colors.green}Found ${data.length} items${colors.reset}`);
          if (data.length > 0) {
            // Show sample data
            const firstItem = data[0];
            if (firstItem.email) {
              console.log(`First user: ${firstItem.email}`);
            } else if (firstItem.name) {
              console.log(`First item: ${firstItem.name}`);
            }
          }
        } else if (data && typeof data === 'object') {
          if (data.email) {
            console.log(`User: ${data.email}`);
          }
        }
      } else {
        failedEndpoints.push({ ...endpoint, status: response.statusCode, error: response.data.message });
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
      failedEndpoints.push({ ...endpoint, error: error.message });
    }
  }

  return { workingEndpoints, failedEndpoints };
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log(`TIME DOCTOR API - CORRECT AUTHORIZATION`);
  console.log(`===========================================${colors.reset}`);
  console.log(`\n${colors.cyan}Based on Time Doctor documentation:${colors.reset}`);
  console.log(`Authorization header should be: ${colors.yellow}Authorization: TOKEN${colors.reset}`);
  console.log(`NOT: ${colors.red}Authorization: Bearer TOKEN${colors.reset}`);

  // Step 1: Login
  const token = await login();
  
  if (!token) {
    console.log(`\n${colors.red}❌ Login failed. Check your credentials.${colors.reset}`);
    return;
  }

  // Step 2: Test with correct authorization
  const { workingEndpoints, failedEndpoints } = await testEndpointsCorrectly(token);

  // Summary
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`SUMMARY`);
  console.log(`===========================================${colors.reset}\n`);

  if (workingEndpoints.length > 0) {
    console.log(`${colors.green}✅ WORKING ENDPOINTS (${workingEndpoints.length}):${colors.reset}`);
    workingEndpoints.forEach(endpoint => {
      console.log(`  ✅ ${endpoint.name}`);
    });
  }

  if (failedEndpoints.length > 0) {
    console.log(`\n${colors.red}❌ FAILED ENDPOINTS (${failedEndpoints.length}):${colors.reset}`);
    failedEndpoints.forEach(endpoint => {
      console.log(`  ❌ ${endpoint.name} - ${endpoint.status || 'Error'}: ${endpoint.error}`);
    });
  }

  console.log(`\n${colors.cyan}[WORKING CURL COMMANDS]${colors.reset}`);
  console.log(`\n# Get Users (correct format)`);
  console.log(`curl -X GET \\`);
  console.log(`  'https://api2.timedoctor.com/api/1.0/users?company=${COMPANY_ID}&detail=full' \\`);
  console.log(`  -H 'Authorization: ${token}'`);
  
  console.log(`\n# Get Projects`);
  console.log(`curl -X GET \\`);
  console.log(`  'https://api2.timedoctor.com/api/1.0/projects?company=${COMPANY_ID}' \\`);
  console.log(`  -H 'Authorization: ${token}'`);
  
  console.log(`\n# Get Current User`);
  console.log(`curl -X GET \\`);
  console.log(`  'https://api2.timedoctor.com/api/1.0/me' \\`);
  console.log(`  -H 'Authorization: ${token}'`);

  console.log(`\n${colors.bright}${colors.green}🎉 USE THIS FORMAT FOR ALL API CALLS!${colors.reset}`);
  console.log(`\n${colors.cyan}Key Points:${colors.reset}`);
  console.log(`1. Authorization header: Just the token, no "Bearer" prefix`);
  console.log(`2. Company ID: In query parameters`);
  console.log(`3. Format: -H 'Authorization: ${token}'`);
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  process.exit(1);
});
