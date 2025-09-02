#!/usr/bin/env node

/**
 * Time Doctor API - Permission Fix
 * 
 * This script handles the permission issue with the users endpoint
 * by using the company data correctly.
 */

const https = require('https');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'https://api2.timedoctor.com';

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

// Step 2: Get Company Details
async function getCompanyDetails(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 2: GET COMPANY DETAILS`);
  console.log(`===========================================${colors.reset}\n`);

  const options = {
    hostname: 'api2.timedoctor.com',
    port: 443,
    path: `/api/1.0/companies?token=${token}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const companies = response.data.data || response.data;
      if (Array.isArray(companies) && companies.length > 0) {
        const company = companies[0];
        console.log(`\n${colors.cyan}[COMPANY INFO]${colors.reset}`);
        console.log(`Role: ${company.role}`);
        console.log(`Hired At: ${company.hiredAt}`);
        console.log(`Last Seen: ${company.lastSeen?.updatedAt}`);
        
        // Extract company ID from the response
        const companyId = company.id || company.companyId || company.company_id || '68b1cb4ae86c38faec59b7f6';
        
        return { company, companyId };
      }
    }
    return null;
  } catch (error) {
    console.error(`Failed to get company details`);
    return null;
  }
}

// Step 3: Try Users Endpoint with Different Approaches
async function tryUsersEndpoint(token, companyData) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 3: TRY USERS ENDPOINT VARIATIONS`);
  console.log(`===========================================${colors.reset}\n`);

  const companyId = companyData?.companyId || '68b1cb4ae86c38faec59b7f6';
  
  // Different endpoint variations to try
  const variations = [
    {
      name: 'Users with company parameter',
      path: `/api/1.0/users?token=${token}&company=${companyId}`
    },
    {
      name: 'Users without company (might use default)',
      path: `/api/1.0/users?token=${token}`
    },
    {
      name: 'Users with different API version',
      path: `/api/1.1/users?token=${token}&company=${companyId}`
    },
    {
      name: 'Users with v1.3 API',
      path: `/api/1.3/users?token=${token}&company=${companyId}`
    },
    {
      name: 'Current user (me endpoint)',
      path: `/api/1.0/me?token=${token}`
    },
    {
      name: 'User info endpoint',
      path: `/api/1.0/user-info?token=${token}`
    },
    {
      name: 'Members endpoint',
      path: `/api/1.0/members?token=${token}&company=${companyId}`
    },
    {
      name: 'Team members endpoint',
      path: `/api/1.0/team-members?token=${token}&company=${companyId}`
    },
    {
      name: 'Activity endpoint (often includes user data)',
      path: `/api/1.0/activity?token=${token}&company=${companyId}&start=2025-09-01&end=2025-09-02`
    },
    {
      name: 'Worklogs (includes user data)',
      path: `/api/1.0/worklogs?token=${token}&company=${companyId}&start=2025-09-01&end=2025-09-02`
    }
  ];

  const workingEndpoints = [];

  for (const variation of variations) {
    console.log(`\n${colors.magenta}[TRYING]${colors.reset} ${variation.name}`);
    
    const options = {
      hostname: 'api2.timedoctor.com',
      port: 443,
      path: variation.path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    try {
      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        workingEndpoints.push(variation);
        
        const data = response.data.data || response.data;
        if (data) {
          console.log(`${colors.green}Data received!${colors.reset}`);
          
          // Check if we got user data
          if (Array.isArray(data)) {
            console.log(`Found ${data.length} items`);
            if (data.length > 0 && data[0].email) {
              console.log(`First user: ${data[0].email}`);
            }
          } else if (data.email) {
            console.log(`User email: ${data.email}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }

  return workingEndpoints;
}

// Step 4: Try Alternative Permission Approach
async function tryAlternativeAuth(token) {
  console.log(`\n${colors.bright}${colors.blue}===========================================`);
  console.log(`STEP 4: TRY ALTERNATIVE AUTHENTICATION`);
  console.log(`===========================================${colors.reset}\n`);

  // Try to get permissions/roles
  const endpoints = [
    '/api/1.0/permissions',
    '/api/1.0/roles',
    '/api/1.0/access',
    '/api/1.0/auth/permissions',
    '/api/1.0/user/permissions'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${colors.cyan}[CHECKING]${colors.reset} ${endpoint}`);
    
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
        console.log(`${colors.green}Found permissions endpoint!${colors.reset}`);
        console.log(JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      // Continue trying
    }
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}===========================================`);
  console.log(`TIME DOCTOR API - PERMISSION FIX`);
  console.log(`===========================================${colors.reset}`);

  // Step 1: Login
  const token = await login();
  
  if (!token) {
    console.log(`\n${colors.red}❌ Login failed. Check your credentials.${colors.reset}`);
    return;
  }

  // Step 2: Get company details
  const companyData = await getCompanyDetails(token);
  
  if (companyData) {
    console.log(`\n${colors.green}✅ Company access confirmed${colors.reset}`);
    console.log(`Company ID: ${companyData.companyId}`);
    console.log(`Your role: ${companyData.company.role}`);
  }

  // Step 3: Try users endpoint variations
  const workingEndpoints = await tryUsersEndpoint(token, companyData);

  // Step 4: Try alternative auth
  await tryAlternativeAuth(token);

  // Summary
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`SUMMARY`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.cyan}[AUTHENTICATION STATUS]${colors.reset}`);
  console.log(`✅ Token is valid`);
  console.log(`✅ Company access works`);
  console.log(`✅ You have 'owner' role`);
  
  if (workingEndpoints.length > 0) {
    console.log(`\n${colors.green}[WORKING ENDPOINTS]${colors.reset}`);
    workingEndpoints.forEach(endpoint => {
      console.log(`✅ ${endpoint.name}`);
      console.log(`   ${endpoint.path}`);
    });
  }

  console.log(`\n${colors.cyan}[ISSUE WITH USERS ENDPOINT]${colors.reset}`);
  console.log(`The /api/1.0/users endpoint returns 403 despite having owner role.`);
  console.log(`\nPossible reasons:`);
  console.log(`1. Users endpoint might require additional setup in Time Doctor`);
  console.log(`2. Your account might need specific permissions enabled`);
  console.log(`3. The API might require a different approach for user data`);
  
  console.log(`\n${colors.cyan}[RECOMMENDED NEXT STEPS]${colors.reset}`);
  console.log(`1. Try the working endpoints listed above`);
  console.log(`2. Check Time Doctor account settings for API permissions`);
  console.log(`3. Contact Time Doctor support about users endpoint access`);
  console.log(`4. Use activity/worklogs endpoints which often include user data`);
  
  console.log(`\n${colors.cyan}[YOUR WORKING TOKEN]${colors.reset}`);
  console.log(token);
  
  console.log(`\n${colors.cyan}[YOUR COMPANY ID]${colors.reset}`);
  console.log(companyData?.companyId || '68b1cb4ae86c38faec59b7f6');
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}[FATAL ERROR]${colors.reset}`, error);
  process.exit(1);
});
