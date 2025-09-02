#!/usr/bin/env node

/**
 * Time Doctor API Working Configuration
 * 
 * This script demonstrates the working Time Doctor API integration
 * with the correct company ID and token usage.
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

  console.log(`Logging in as: ${loginData.email}`);

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

// Step 2: Test API Endpoints with Company ID
async function testEndpoints(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`TESTING TIME DOCTOR API ENDPOINTS`);
  console.log(`===========================================${colors.reset}\n`);

  // Your company ID
  const COMPANY_ID = process.env.TIME_DOCTOR_COMPANY_ID || '68b1cb4ae86c38faec59b7f6';
  
  console.log(`${colors.cyan}Company ID: ${COMPANY_ID}${colors.reset}\n`);

  const endpoints = [
    {
      name: 'Users',
      path: `/api/1.0/users?token=${token}&company=${COMPANY_ID}&detail=full&limit=10`
    },
    {
      name: 'Current User',
      path: `/api/1.0/me?token=${token}`
    },
    {
      name: 'Projects',
      path: `/api/1.0/projects?token=${token}&company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Tasks',
      path: `/api/1.0/tasks?token=${token}&company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Worklogs',
      path: `/api/1.0/worklogs?token=${token}&company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Activity',
      path: `/api/1.0/activity?token=${token}&company=${COMPANY_ID}&limit=10`
    },
    {
      name: 'Companies',
      path: `/api/1.0/companies?token=${token}`
    }
  ];

  const workingEndpoints = [];
  
  for (const endpoint of endpoints) {
    console.log(`\n${colors.magenta}[TESTING ${endpoint.name.toUpperCase()}]${colors.reset}`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        workingEndpoints.push(endpoint);
        
        // Display sample data
        const data = response.data.data || response.data;
        if (Array.isArray(data) && data.length > 0) {
          console.log(`${colors.green}Found ${data.length} items${colors.reset}`);
          
          // Show first item as example
          const firstItem = data[0];
          console.log(`${colors.cyan}Sample:${colors.reset}`, JSON.stringify(firstItem, null, 2).substring(0, 200) + '...');
        } else if (data && typeof data === 'object') {
          console.log(`${colors.cyan}Data:${colors.reset}`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
        }
      }
    } catch (error) {
      console.error(`Failed to test ${endpoint.name}`);
    }
  }

  return workingEndpoints;
}

// Step 3: Create TimeDocktorClient configuration
function generateClientCode(token, companyId) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`WORKING CONFIGURATION`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.cyan}[ENVIRONMENT VARIABLES (.env)]${colors.reset}`);
  console.log(`TIME_DOCTOR_EMAIL=${process.env.TIME_DOCTOR_EMAIL || 'your-email@example.com'}`);
  console.log(`TIME_DOCTOR_PASSWORD=${process.env.TIME_DOCTOR_PASSWORD || 'your-password'}`);
  console.log(`TIME_DOCTOR_COMPANY_ID=${companyId}`);
  console.log(`TIME_DOCTOR_TOKEN=${token}\n`);

  console.log(`${colors.cyan}[JAVASCRIPT CLIENT CODE]${colors.reset}`);
  console.log(`\`\`\`javascript
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0',
  token: '${token}',
  companyId: '${companyId}'
});

// Get users
const users = await client.getUsers();

// Get projects  
const projects = await client.getProjects();

// Get worklogs
const worklogs = await client.getWorklogs();
\`\`\`\n`);

  console.log(`${colors.cyan}[CURL COMMANDS]${colors.reset}`);
  console.log(`# Get Users`);
  console.log(`curl "https://api2.timedoctor.com/api/1.0/users?token=${token}&company=${companyId}&detail=full"\n`);
  
  console.log(`# Get Projects`);
  console.log(`curl "https://api2.timedoctor.com/api/1.0/projects?token=${token}&company=${companyId}"\n`);
  
  console.log(`# Get Worklogs`);
  console.log(`curl "https://api2.timedoctor.com/api/1.0/worklogs?token=${token}&company=${companyId}"\n`);
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log(`TIME DOCTOR API - WORKING SOLUTION`);
  console.log(`===========================================${colors.reset}`);
  console.log(`\n${colors.green}✅ COMPANY ID FOUND: 68b1cb4ae86c38faec59b7f6${colors.reset}`);

  // Step 1: Login
  const token = await login();
  
  if (!token) {
    console.log(`\n${colors.red}❌ Login failed. Check your credentials.${colors.reset}`);
    return;
  }

  console.log(`\n${colors.green}✅ LOGIN SUCCESSFUL${colors.reset}`);
  console.log(`Token: ${token}`);

  // Step 2: Test endpoints
  const workingEndpoints = await testEndpoints(token);

  // Step 3: Summary
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`SUMMARY`);
  console.log(`===========================================${colors.reset}\n`);

  if (workingEndpoints.length > 0) {
    console.log(`${colors.green}✅ WORKING ENDPOINTS (${workingEndpoints.length}):${colors.reset}`);
    workingEndpoints.forEach(endpoint => {
      console.log(`  - ${endpoint.name}`);
    });

    // Generate configuration
    generateClientCode(token, '68b1cb4ae86c38faec59b7f6');
    
    console.log(`\n${colors.bright}${colors.green}🎉 TIME DOCTOR API IS WORKING!${colors.reset}`);
    console.log(`\nThe key is using token as a query parameter with the company ID.`);
    console.log(`Format: ?token=TOKEN&company=68b1cb4ae86c38faec59b7f6`);
  } else {
    console.log(`${colors.red}❌ No endpoints working. Check the token and company ID.${colors.reset}`);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  process.exit(1);
});
