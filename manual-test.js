#!/usr/bin/env node

/**
 * Time Doctor API Manual Test Script - Fixed Version
 * 
 * This script handles the company/workspace selection required by Time Doctor API
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

  if (process.env.TIME_DOCTOR_TOTP) {
    loginData.totpCode = process.env.TIME_DOCTOR_TOTP;
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
      
      let token = null;
      if (response.data.data && response.data.data.token) {
        token = response.data.data.token;
      } else if (response.data.token) {
        token = response.data.token;
      }

      if (token) {
        console.log(`\n${colors.bright}${colors.green}🎫 TOKEN EXTRACTED${colors.reset}`);
        console.log(`Token: ${token}`);
        return { token, fullResponse: response.data };
      }
    }
    
    console.log(`\n${colors.red}❌ LOGIN FAILED${colors.reset}`);
    return { token: null, fullResponse: response.data };
  } catch (error) {
    console.error(`\n${colors.red}❌ LOGIN REQUEST FAILED${colors.reset}`, error);
    return { token: null, fullResponse: null };
  }
}

// Step 2: Get Companies/Workspaces
async function getCompanies(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 2: GET COMPANIES/WORKSPACES`);
  console.log(`===========================================${colors.reset}\n`);

  // Try different endpoints for companies
  const endpoints = [
    '/api/1.0/companies',
    '/api/1.3/companies',
    '/api/1.0/company',
    '/api/1.0/workspaces',
    '/api/1.0/organizations'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${colors.cyan}[TRYING ENDPOINT]${colors.reset} ${endpoint}`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: `${endpoint}?token=${token}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`\n${colors.green}✅ COMPANIES ENDPOINT FOUND: ${endpoint}${colors.reset}`);
        
        const companies = response.data.data || response.data;
        if (Array.isArray(companies) && companies.length > 0) {
          console.log(`\n${colors.cyan}[COMPANIES FOUND]${colors.reset}`);
          companies.forEach((company, index) => {
            console.log(`\n${colors.magenta}[COMPANY ${index + 1}]${colors.reset}`);
            console.log(`  ID: ${company.id || company.company_id || company._id}`);
            console.log(`  Name: ${company.name || company.company_name || 'N/A'}`);
          });
          
          // Return the first company ID
          const companyId = companies[0].id || companies[0].company_id || companies[0]._id;
          return { companyId, companies, endpoint };
        }
      }
    } catch (error) {
      console.error(`${colors.red}Error trying ${endpoint}${colors.reset}`);
    }
  }

  console.log(`\n${colors.yellow}⚠️  No companies endpoint found${colors.reset}`);
  return { companyId: null, companies: [], endpoint: null };
}

// Step 3: Test Users with Company Context
async function getUsersWithCompany(token, companyId) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 3: GET USERS WITH COMPANY CONTEXT`);
  console.log(`===========================================${colors.reset}\n`);

  // Try different parameter combinations
  const paramVariations = [
    `token=${token}&company=${companyId}&detail=full&limit=5`,
    `token=${token}&company_id=${companyId}&detail=full&limit=5`,
    `token=${token}&companyId=${companyId}&detail=full&limit=5`,
    `token=${token}&workspace=${companyId}&detail=full&limit=5`,
    `token=${token}&organization=${companyId}&detail=full&limit=5`,
    `token=${token}&detail=full&limit=5&filter[company]=${companyId}`,
    `token=${token}&detail=full&limit=5` // Try without company
  ];

  for (const params of paramVariations) {
    console.log(`\n${colors.cyan}[TRYING PARAMS]${colors.reset} ${params.substring(0, 80)}...`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: `/api/1.0/users?${params}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`\n${colors.green}${colors.bright}✅ USERS RETRIEVED SUCCESSFULLY!${colors.reset}`);
        
        const users = response.data.data || response.data;
        if (Array.isArray(users)) {
          console.log(`\n${colors.cyan}[USERS FOUND]${colors.reset} ${users.length} users`);
          users.forEach((user, index) => {
            console.log(`\n${colors.magenta}[USER ${index + 1}]${colors.reset}`);
            console.log(`  ID: ${user.id || user.user_id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Name: ${user.name || user.full_name || 'N/A'}`);
            console.log(`  Role: ${user.role || 'N/A'}`);
          });
        }
        
        return { success: true, users, params };
      } else if (response.statusCode === 403) {
        console.log(`${colors.yellow}Permission denied with these parameters${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}Error with params${colors.reset}`);
    }
  }

  return { success: false, users: [], params: null };
}

// Step 4: Try Alternative Endpoints
async function tryAlternativeEndpoints(token, companyId) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 4: TRY ALTERNATIVE ENDPOINTS`);
  console.log(`===========================================${colors.reset}\n`);

  const endpoints = [
    `/api/1.0/me?token=${token}`,
    `/api/1.0/user?token=${token}`,
    `/api/1.0/account?token=${token}`,
    `/api/1.0/profile?token=${token}`,
    `/api/1.0/activity?token=${token}&company=${companyId || ''}`,
    `/api/1.0/projects?token=${token}&company=${companyId || ''}`,
    `/api/1.0/tasks?token=${token}&company=${companyId || ''}`
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${colors.cyan}[TRYING]${colors.reset} ${endpoint}`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log(`${colors.green}✅ ENDPOINT WORKING: ${endpoint.split('?')[0]}${colors.reset}`);
        return { success: true, endpoint, data: response.data };
      }
    } catch (error) {
      console.error(`${colors.red}Failed${colors.reset}`);
    }
  }

  return { success: false };
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log(`TIME DOCTOR API - COMPANY CONTEXT FIX`);
  console.log(`===========================================${colors.reset}`);

  // Step 1: Login
  const loginResult = await login();
  
  if (!loginResult.token) {
    console.log(`\n${colors.red}Cannot proceed without token${colors.reset}`);
    return;
  }

  // Step 2: Get Companies
  const { companyId, companies, endpoint } = await getCompanies(loginResult.token);
  
  if (companyId) {
    console.log(`\n${colors.green}Using Company ID: ${companyId}${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}No company ID found, trying without it${colors.reset}`);
  }

  // Step 3: Get Users with Company
  const usersResult = await getUsersWithCompany(loginResult.token, companyId);
  
  // Step 4: Try Alternative Endpoints
  if (!usersResult.success) {
    const altResult = await tryAlternativeEndpoints(loginResult.token, companyId);
  }

  // Summary
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`SUMMARY`);
  console.log(`===========================================${colors.reset}`);
  
  console.log(`\n${colors.cyan}[WORKING CONFIGURATION]${colors.reset}`);
  console.log(`Token: ${loginResult.token}`);
  
  if (companyId) {
    console.log(`Company ID: ${companyId}`);
  }
  
  if (usersResult.success) {
    console.log(`\n${colors.green}✅ USERS ENDPOINT WORKING${colors.reset}`);
    console.log(`Working parameters: ${usersResult.params}`);
    console.log(`\n${colors.cyan}[CURL COMMAND]${colors.reset}`);
    console.log(`curl "https://api2.timedoctor.com/api/1.0/users?${usersResult.params}"`);
  } else {
    console.log(`\n${colors.yellow}⚠️  MANUAL STEPS REQUIRED${colors.reset}`);
    console.log(`\n1. Log in to https://webapi.timedoctor.com`);
    console.log(`2. Open Developer Tools (F12) → Network tab`);
    console.log(`3. Navigate to any page that shows users`);
    console.log(`4. Look for the API request to /users`);
    console.log(`5. Copy the full URL with all parameters`);
    console.log(`6. Note the company parameter used`);
    console.log(`\n${colors.cyan}[TOKEN FOR MANUAL TESTING]${colors.reset}`);
    console.log(loginResult.token);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  process.exit(1);
});
