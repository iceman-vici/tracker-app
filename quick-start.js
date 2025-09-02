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

  // Step 1: Choose environment
  console.log(`${colors.cyan}Step 1: Choose Environment${colors.reset}`);
  console.log('1. Local Development Server (http://localhost:3000)');
  console.log('2. Production Time Doctor API (https://api2.timedoctor.com)');
  
  const envChoice = await question('\nSelect environment (1 or 2): ');
  const environment = envChoice.trim() === '2' ? 'production' : 'local';
  
  apiConfig.setEnvironment(environment);
  
  const client = new TimeDocktorClient({
    baseURL: apiConfig.getCurrentEndpoint().baseURL,
    debug: false
  });

  console.log(`\n${colors.green}✓ Using ${apiConfig.getCurrentEndpoint().name}${colors.reset}`);
  console.log(`${colors.green}  URL: ${apiConfig.getCurrentEndpoint().baseURL}${colors.reset}\n`);

  // Step 2: Get credentials
  console.log(`${colors.cyan}Step 2: Login Credentials${colors.reset}`);
  
  let email, password;
  
  if (environment === 'local') {
    console.log('\nDefault local credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    
    const useDefault = await question('\nUse default credentials? (y/n): ');
    
    if (useDefault.toLowerCase() === 'y') {
      email = 'admin@example.com';
      password = 'password123';
    }
  }
  
  if (!email) {
    email = await question('Email: ');
    password = await question('Password: ');
  }

  // Step 3: Test connection
  console.log(`\n${colors.cyan}Step 3: Testing Connection...${colors.reset}`);
  
  try {
    // Check if server is running (for local)
    if (environment === 'local') {
      try {
        const http = require('http');
        await new Promise((resolve, reject) => {
          http.get('http://localhost:3000/health', (res) => {
            if (res.statusCode === 200) resolve();
            else reject(new Error('Server not responding'));
          }).on('error', reject);
        });
      } catch (error) {
        console.log(`\n${colors.red}❌ Local server is not running!${colors.reset}`);
        console.log(`${colors.yellow}Please start the server first: npm start${colors.reset}`);
        rl.close();
        return;
      }
    }

    // Login
    console.log('\n🔐 Logging in...');
    const loginResponse = await client.login(email, password);
    
    console.log(`${colors.green}✅ Login successful!${colors.reset}`);
    console.log(`   User: ${loginResponse.user.email}`);
    console.log(`   Role: ${loginResponse.user.role || 'user'}`);
    
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
  baseURL: '${apiConfig.getCurrentEndpoint().baseURL}'
});

await client.login('${email}', 'your-password');
const worklogs = await client.getWorklogs();
console.log(worklogs);
${colors.reset}`);

  } catch (error) {
    console.log(`\n${colors.red}❌ Connection failed!${colors.reset}`);
    console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
    
    if (environment === 'production') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your Time Doctor credentials');
      console.log('2. Ensure you have an active Time Doctor account');
      console.log('3. Check your internet connection');
      console.log('4. Verify the API is accessible from your location');
    } else {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure the local server is running: npm start');
      console.log('2. Check if port 3000 is available');
      console.log('3. Verify the credentials are correct');
    }
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
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Main execution
showBanner();
setTimeout(() => {
  quickStart().catch(console.error);
}, 1000);
