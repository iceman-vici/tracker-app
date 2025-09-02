#!/usr/bin/env node

/**
 * Quick Start Script for Time Doctor API
 * This script helps you quickly test connection to Time Doctor API
 * 
 * Usage:
 *   node quick-start.js
 */

const readline = require('readline');
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');
const apiConfig = require('./src/config/apiConfig');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function quickStart() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}     Time Doctor API - Quick Start${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Step 1: Display API endpoint
  console.log(`${colors.cyan}Step 1: API Configuration${colors.reset}`);
  console.log(`Using Time Doctor Production API`);
  
  const client = new TimeDocktorClient({
    baseURL: apiConfig.getCurrentEndpoint().baseURL,
    debug: false
  });

  console.log(`\n${colors.green}✓ API Endpoint: ${apiConfig.getCurrentEndpoint().baseURL}${colors.reset}\n`);

  // Step 2: Get credentials
  console.log(`${colors.cyan}Step 2: Login Credentials${colors.reset}`);
  console.log('\nPlease enter your Time Doctor credentials:');
  
  const email = await question('Email: ');
  const password = await question('Password: ');
  
  const has2FA = await question('Do you have 2FA enabled? (y/n): ');
  let totpCode = '';
  if (has2FA.toLowerCase() === 'y') {
    totpCode = await question('Enter 2FA code: ');
  }

  // Step 3: Test connection
  console.log(`\n${colors.cyan}Step 3: Testing Connection...${colors.reset}`);
  
  try {
    // Login
    console.log('\n🔐 Logging in...');
    const loginResponse = await client.login(email, password, totpCode || '', 'write');
    
    console.log(`${colors.green}✅ Login successful!${colors.reset}`);
    
    // Display token info
    if (loginResponse.data) {
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      if (loginResponse.data.expireAt) {
        console.log(`   Expires: ${loginResponse.data.expireAt}`);
      }
    } else if (loginResponse.token) {
      console.log(`   Token: ${loginResponse.token.substring(0, 20)}...`);
    }
    
    // Step 4: Quick tests
    console.log(`\n${colors.cyan}Step 4: Running Quick Tests...${colors.reset}`);
    
    // Test 1: Get Users
    console.log('\n📋 Fetching users...');
    try {
      const users = await client.getUsers();
      const userCount = users.data ? users.data.length : users.length || 0;
      console.log(`${colors.green}✓ Found ${userCount} users${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not fetch users: ${error.message}${colors.reset}`);
    }

    // Test 2: Get Projects
    console.log('\n📁 Fetching projects...');
    try {
      const projects = await client.getProjects();
      const projectCount = projects.data ? projects.data.length : projects.length || 0;
      console.log(`${colors.green}✓ Found ${projectCount} projects${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not fetch projects: ${error.message}${colors.reset}`);
    }

    // Test 3: Get Worklogs
    console.log('\n⏰ Fetching worklogs...');
    try {
      const worklogs = await client.getWorklogs();
      const worklogCount = worklogs.total || (worklogs.data ? worklogs.data.length : 0) || 0;
      console.log(`${colors.green}✓ Found ${worklogCount} worklogs${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not fetch worklogs: ${error.message}${colors.reset}`);
    }

    // Step 5: Next steps
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}🎉 Connection Successful!${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
    
    console.log('Next steps:');
    console.log(`1. Check out the full examples: ${colors.cyan}node examples/time-doctor-api-example.js${colors.reset}`);
    console.log(`2. Read the documentation: ${colors.cyan}README.md${colors.reset}`);
    console.log(`3. Explore the API client: ${colors.cyan}src/clients/TimeDocktorClient.js${colors.reset}`);
    
    console.log('\n📝 Quick Code Example:');
    console.log(`${colors.yellow}
const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

const client = new TimeDocktorClient({
  baseURL: 'https://api2.timedoctor.com/api/1.0'
});

// Login with proper parameters
await client.login('${email}', 'your-password', '', 'write');
// Or use simple login for convenience
await client.simpleLogin('${email}', 'your-password');

const worklogs = await client.getWorklogs();
console.log(worklogs);
${colors.reset}`);

  } catch (error) {
    console.log(`\n${colors.red}❌ Connection failed!${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your Time Doctor credentials');
    console.log('2. Ensure you have an active Time Doctor account');
    console.log('3. If you have 2FA enabled, make sure to enter the correct code');
    console.log('4. Check your internet connection');
    console.log('5. Verify the API is accessible from your location');
  }

  rl.close();
}

// ASCII Art Banner
function showBanner() {
  console.clear();
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ████████╗██╗███╗   ███╗███████╗                    ║
║     ╚══██╔══╝██║████╗ ████║██╔════╝                    ║
║        ██║   ██║██╔████╔██║█████╗                      ║
║        ██║   ██║██║╚██╔╝██║██╔══╝                      ║
║        ██║   ██║██║ ╚═╝ ██║███████╗                    ║
║        ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝                    ║
║                                                          ║
║     ██████╗  ██████╗  ██████╗████████╗ ██████╗ ██████╗ ║
║     ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗║
║     ██║  ██║██║   ██║██║        ██║   ██║   ██║██████╔╝║
║     ██║  ██║██║   ██║██║        ██║   ██║   ██║██╔══██╗║
║     ██████╔╝╚██████╔╝╚██████╗   ██║   ╚██████╔╝██║  ██║║
║     ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝║
║                                                          ║
║                    API Quick Start                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╗
${colors.reset}`);
}

// Main execution
showBanner();
setTimeout(() => {
  quickStart().catch(console.error);
}, 1000);