#!/usr/bin/env node

/**
 * Setup Script for Time Tracker API
 * This script helps you set up your environment file with Time Doctor credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

async function setup() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}     Time Tracker API - Environment Setup${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠ .env file already exists${colors.reset}`);
    const overwrite = await question('Do you want to update it? (y/n): ');
    
    if (overwrite.toLowerCase() !== 'y') {
      console.log(`${colors.cyan}Setup cancelled${colors.reset}`);
      rl.close();
      return;
    }
  }

  // Read .env.example
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  } else {
    // Create basic env content if .env.example doesn't exist
    envContent = `# Server Configuration
NODE_ENV=production
PORT=3000

# Time Doctor API Credentials
TIMEDOCTOR_EMAIL=
TIMEDOCTOR_PASSWORD=
TIMEDOCTOR_API_KEY=

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this

# CORS Settings
CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Timezone
TIMEZONE=UTC

# Logging
LOG_LEVEL=debug
DEBUG=false`;
  }

  console.log(`${colors.cyan}Enter your Time Doctor credentials:${colors.reset}`);
  console.log(`${colors.yellow}(These will be saved in your local .env file only)${colors.reset}\n`);
  
  const email = await question('Time Doctor Email: ');
  const password = await question('Time Doctor Password: ');
  const apiKey = await question('Time Doctor API Key (optional, press Enter to skip): ');

  // Update the env content with user credentials
  envContent = envContent.replace(/TIMEDOCTOR_EMAIL=.*/g, `TIMEDOCTOR_EMAIL=${email}`);
  envContent = envContent.replace(/TIMEDOCTOR_PASSWORD=.*/g, `TIMEDOCTOR_PASSWORD=${password}`);
  if (apiKey) {
    envContent = envContent.replace(/TIMEDOCTOR_API_KEY=.*/g, `TIMEDOCTOR_API_KEY=${apiKey}`);
  }

  // Generate a random JWT secret
  const jwtSecret = require('crypto').randomBytes(32).toString('hex');
  const refreshSecret = require('crypto').randomBytes(32).toString('hex');
  envContent = envContent.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
  envContent = envContent.replace(/REFRESH_TOKEN_SECRET=.*/g, `REFRESH_TOKEN_SECRET=${refreshSecret}`);

  // Write the .env file
  fs.writeFileSync(envPath, envContent);

  console.log(`\n${colors.green}✅ Environment file created successfully!${colors.reset}`);
  console.log(`${colors.green}   Location: ${envPath}${colors.reset}`);
  
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log('1. Install dependencies: npm install');
  console.log('2. Test the connection: node test-api.js');
  console.log('3. Or use quick start: npm run quick-start');
  
  console.log(`\n${colors.yellow}⚠ Important:${colors.reset}`);
  console.log('• Never commit your .env file to version control');
  console.log('• Keep your credentials secure');
  console.log('• The .env file is already in .gitignore');
  
  rl.close();
}

// Run setup
setup().catch(console.error);