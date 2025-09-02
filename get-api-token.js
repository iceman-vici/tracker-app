#!/usr/bin/env node

/**
 * Time Doctor API Token Guide
 * 
 * This script explains the difference between login tokens and API tokens
 * and helps you get the correct token for API access.
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

console.log(`${colors.bright}${colors.red}===========================================`);
console.log(`IMPORTANT: TWO DIFFERENT TOKENS!`);
console.log(`===========================================${colors.reset}\n`);

console.log(`${colors.yellow}⚠️  DISCOVERY: Time Doctor has TWO different authentication systems:${colors.reset}\n`);

console.log(`${colors.cyan}1. LOGIN TOKEN (What you have)${colors.reset}`);
console.log(`   - Obtained from: /api/1.0/login`);
console.log(`   - Format: Short alphanumeric (e.g., 1mAd5JoRVF0i7RCGNgEP...)`);
console.log(`   - Used for: Session management, web app`);
console.log(`   - ${colors.red}NOT for API endpoints!${colors.reset}\n`);

console.log(`${colors.cyan}2. API TOKEN (What you need)${colors.reset}`);
console.log(`   - Obtained from: Time Doctor Dashboard`);
console.log(`   - Format: Longer string (e.g., 1iuZiySUuR0reHpdaRNDyejabhAGmwEN17XzqGgDRMwU)`);
console.log(`   - Used for: API endpoints (/users, /projects, etc.)`);
console.log(`   - ${colors.green}This is what works with the API!${colors.reset}\n`);

console.log(`${colors.bright}${colors.blue}===========================================`);
console.log(`HOW TO GET YOUR API TOKEN`);
console.log(`===========================================${colors.reset}\n`);

console.log(`${colors.green}METHOD 1: Time Doctor Dashboard (Recommended)${colors.reset}`);
console.log(`1. Go to: https://webapi.timedoctor.com`);
console.log(`2. Log in with your credentials`);
console.log(`3. Navigate to one of these locations:`);
console.log(`   - Company Settings → API`);
console.log(`   - Profile → API Access`);
console.log(`   - Settings → Integrations → API Keys`);
console.log(`   - Developer → API Tokens`);
console.log(`4. Generate or copy your API token\n`);

console.log(`${colors.green}METHOD 2: Browser Developer Tools${colors.reset}`);
console.log(`1. Log in to https://webapi.timedoctor.com`);
console.log(`2. Open Developer Tools (F12)`);
console.log(`3. Go to Network tab`);
console.log(`4. Click on any page that loads data (Users, Projects, etc.)`);
console.log(`5. Look for API calls to api2.timedoctor.com`);
console.log(`6. Check the Request Headers`);
console.log(`7. Copy the Authorization header value\n`);

console.log(`${colors.green}METHOD 3: Check Documentation${colors.reset}`);
console.log(`1. Go to: https://webapi.timedoctor.com`);
console.log(`2. Look for API Documentation or Developer section`);
console.log(`3. There should be a way to view/generate your API token\n`);

console.log(`${colors.bright}${colors.blue}===========================================`);
console.log(`ONCE YOU HAVE THE API TOKEN`);
console.log(`===========================================${colors.reset}\n`);

console.log(`${colors.cyan}1. Add it to your .env file:${colors.reset}`);
console.log(`   TIME_DOCTOR_API_TOKEN=your-long-api-token-here\n`);

console.log(`${colors.cyan}2. Test it with curl:${colors.reset}`);
console.log(`   curl -X GET \\`);
console.log(`     'https://api2.timedoctor.com/api/1.0/users?company=68b1cb4ae86c38faec59b7f6' \\`);
console.log(`     -H 'Authorization: YOUR_API_TOKEN'\n`);

console.log(`${colors.cyan}3. Use it in Node.js:${colors.reset}`);
console.log(`\`\`\`javascript
const fetch = require('node-fetch');

const API_TOKEN = 'your-api-token-from-dashboard'; // NOT login token!
const COMPANY_ID = '68b1cb4ae86c38faec59b7f6';

const response = await fetch(
  \`https://api2.timedoctor.com/api/1.0/users?company=\${COMPANY_ID}\`,
  {
    headers: {
      'Authorization': API_TOKEN
    }
  }
);

const data = await response.json();
console.log(data);
\`\`\`\n`);

console.log(`${colors.bright}${colors.yellow}===========================================`);
console.log(`TROUBLESHOOTING`);
console.log(`===========================================${colors.reset}\n`);

console.log(`${colors.red}If you can't find the API token in the dashboard:${colors.reset}`);
console.log(`1. Your account might not have API access enabled`);
console.log(`2. Contact Time Doctor support to enable API access`);
console.log(`3. You might need a different account tier/plan`);
console.log(`4. Check with your account administrator\n`);

console.log(`${colors.cyan}Support Email Template:${colors.reset}`);
console.log(`---`);
console.log(`Subject: API Token Access Request\n`);
console.log(`Hi Time Doctor Support,\n`);
console.log(`I need to access the Time Doctor API for integration purposes.`);
console.log(`I can successfully login via /api/1.0/login but the token returned`);
console.log(`doesn't work with API endpoints like /users.`);
console.log(`\nHow do I get an API token for accessing the REST API endpoints?`);
console.log(`My company ID is: 68b1cb4ae86c38faec59b7f6`);
console.log(`\nThank you!`);
console.log(`---\n`);

console.log(`${colors.bright}${colors.magenta}===========================================`);
console.log(`SUMMARY`);
console.log(`===========================================${colors.reset}\n`);

console.log(`${colors.red}❌ Login token ≠ API token${colors.reset}`);
console.log(`${colors.green}✅ You need an API token from the Time Doctor dashboard${colors.reset}`);
console.log(`${colors.yellow}⚠️  The login endpoint doesn't provide API access tokens${colors.reset}\n`);

console.log(`${colors.cyan}Next step: Log into Time Doctor dashboard and find your API token!${colors.reset}\n`);
