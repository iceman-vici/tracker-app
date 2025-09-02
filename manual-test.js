#!/usr/bin/env node

/**
 * Manual Test Script for Time Doctor API
 * This allows you to manually set a token and test the API
 * Usage: node manual-test.js
 */

const TimeDocktorClient = require('./src/clients/TimeDocktorClient');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function manualTest() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Time Doctor API Manual Test${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Create client
  const client = new TimeDocktorClient({
    baseURL: 'https://api2.timedoctor.com/api/1.0',
    debug: true
  });

  // OPTION 1: Set token manually (if you have one from the documentation)
  // Uncomment and replace with your actual token:
  // client.setToken('YOUR_TOKEN_HERE');
  // Example: client.setToken('118r0IRcYWp0g1frd1pqUNov5TX2r1Y84ozQ5gAbTN68');
  
  console.log(`${colors.yellow}To use this script:${colors.reset}`);
  console.log(`1. Get your token from Time Doctor (via their documentation or login)`);
  console.log(`2. Edit this file and uncomment the client.setToken() line`);
  console.log(`3. Replace 'YOUR_TOKEN_HERE' with your actual token`);
  console.log(`4. Run this script again\n`);
  
  // Check if token is set
  if (!client.token) {
    console.log(`${colors.red}No token set. Please edit this file and add your token.${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✓ Token is set${colors.reset}`);
  console.log(`Token: ${client.token.substring(0, 20)}...\n`);

  // Test API calls
  console.log(`${colors.cyan}Testing API calls...${colors.reset}\n`);

  // Test 1: Get Users
  try {
    console.log('Fetching users...');
    const users = await client.getUsers();
    console.log(`${colors.green}✓ Users fetched successfully${colors.reset}`);
    console.log(`Found ${users.length || users.data?.length || 0} users\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to fetch users: ${error.message}${colors.reset}\n`);
  }

  // Test 2: Get Projects
  try {
    console.log('Fetching projects...');
    const projects = await client.getProjects();
    console.log(`${colors.green}✓ Projects fetched successfully${colors.reset}`);
    console.log(`Found ${projects.length || projects.data?.length || 0} projects\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to fetch projects: ${error.message}${colors.reset}\n`);
  }

  // Test 3: Get Files/Screenshots
  try {
    console.log('Fetching files/screenshots...');
    const files = await client.getFiles();
    console.log(`${colors.green}✓ Files fetched successfully${colors.reset}`);
    console.log(`Found ${files.length || files.data?.length || 0} files\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to fetch files: ${error.message}${colors.reset}\n`);
  }

  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Test completed${colors.reset}`);
}

manualTest().catch(console.error);