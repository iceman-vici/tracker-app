#!/usr/bin/env node

/**
 * Time Doctor API - Debug Users Endpoint
 * 
 * The token works for companies but not users.
 * This script tests different approaches to access the users endpoint.
 */

const https = require('https');
require('dotenv').config();

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

// Helper function for API calls
function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.cyan}[REQUEST]${colors.reset} GET ${path}`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`${colors.yellow}[STATUS]${colors.reset} ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`${colors.green}✅ SUCCESS${colors.reset}`);
          } else {
            console.log(`${colors.red}❌ ERROR:${colors.reset} ${parsed.message || parsed.error}`);
          }
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log(`${colors.bright}${colors.blue}===========================================`);
  console.log(`USERS ENDPOINT PERMISSION DEBUG`);
  console.log(`===========================================${colors.reset}\n`);

  // Get token from login
  const loginData = {
    email: process.env.TIME_DOCTOR_EMAIL,
    password: process.env.TIME_DOCTOR_PASSWORD,
    permissions: 'write'
  };

  // Login first
  console.log(`${colors.cyan}[STEP 1: LOGIN]${colors.reset}`);
  const loginOptions = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: '/api/1.0/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const token = await new Promise((resolve) => {
    const req = https.request(loginOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        const token = parsed.data?.token || parsed.token;
        console.log(`Token obtained: ${token?.substring(0, 20)}...`);
        resolve(token);
      });
    });
    req.write(JSON.stringify(loginData));
    req.end();
  });

  if (!token) {
    console.log(`${colors.red}Failed to get token${colors.reset}`);
    return;
  }

  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`TESTING ENDPOINTS WITH SAME TOKEN`);
  console.log(`===========================================${colors.reset}`);

  // Test 1: Companies (we know this works)
  console.log(`\n${colors.magenta}[TEST 1: COMPANIES - Should Work]${colors.reset}`);
  const companiesResult = await makeRequest('/api/1.0/companies', token);
  
  let companyId = '68b1cb4ae86c38faec59b7f6';
  if (companiesResult.status === 200 && companiesResult.data.data) {
    const company = companiesResult.data.data[0];
    if (company) {
      companyId = company.id || company.companyId || company.company_id || companyId;
      console.log(`Company Role: ${company.role}`);
      console.log(`Company ID: ${companyId}`);
    }
  }

  // Test 2: Users with different parameter combinations
  console.log(`\n${colors.magenta}[TEST 2: USERS - Different Parameter Sets]${colors.reset}`);
  
  const userEndpointVariations = [
    {
      name: 'Basic with company',
      path: `/api/1.0/users?company=${companyId}`
    },
    {
      name: 'With detail parameter',
      path: `/api/1.0/users?company=${companyId}&detail=full`
    },
    {
      name: 'Self only',
      path: `/api/1.0/users?self=true`
    },
    {
      name: 'Without any parameters',
      path: '/api/1.0/users'
    },
    {
      name: 'With limit only',
      path: '/api/1.0/users?limit=1'
    },
    {
      name: 'Company as string literal',
      path: '/api/1.0/users?company=string'  // As shown in docs
    },
    {
      name: 'With page parameter',
      path: `/api/1.0/users?company=${companyId}&page=1&limit=1`
    }
  ];

  for (const variation of userEndpointVariations) {
    console.log(`\n${colors.cyan}Trying: ${variation.name}${colors.reset}`);
    await makeRequest(variation.path, token);
  }

  // Test 3: Other endpoints to verify token works
  console.log(`\n${colors.magenta}[TEST 3: OTHER ENDPOINTS]${colors.reset}`);
  
  const otherEndpoints = [
    '/api/1.0/me',
    `/api/1.0/projects?company=${companyId}`,
    `/api/1.0/tasks?company=${companyId}`,
    `/api/1.0/activity?company=${companyId}`,
    `/api/1.0/work-schedules?company=${companyId}`,
    `/api/1.0/payrolls?company=${companyId}`
  ];

  for (const endpoint of otherEndpoints) {
    const name = endpoint.split('?')[0].split('/').pop();
    console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
    await makeRequest(endpoint, token);
  }

  // Summary
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`ANALYSIS`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.cyan}[FINDINGS]${colors.reset}`);
  console.log(`1. Token IS valid (companies endpoint works)`);
  console.log(`2. Authorization format IS correct (raw token)`);
  console.log(`3. Users endpoint specifically requires something else`);
  
  console.log(`\n${colors.yellow}[POSSIBLE ISSUES]${colors.reset}`);
  console.log(`1. Users endpoint might be disabled for your account`);
  console.log(`2. Requires a different permission scope`);
  console.log(`3. Needs additional headers or parameters`);
  console.log(`4. Company-specific permission setting`);
  
  console.log(`\n${colors.cyan}[WORKAROUNDS]${colors.reset}`);
  console.log(`1. Use /api/1.0/me for current user data`);
  console.log(`2. Use activity/worklogs endpoints (they include user info)`);
  console.log(`3. Check if projects/tasks return assignee data`);
  
  console.log(`\n${colors.green}[NEXT STEPS]${colors.reset}`);
  console.log(`1. Contact Time Doctor support about users endpoint access`);
  console.log(`2. Check account settings for user data permissions`);
  console.log(`3. Try using the web app token instead of login token`);
}

main().catch(console.error);
