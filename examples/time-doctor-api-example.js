#!/usr/bin/env node

/**
 * Time Doctor API Usage Examples
 * This script demonstrates how to use the Time Doctor API client
 * 
 * Usage:
 *   node examples/time-doctor-api-example.js [local|production]
 */

const TimeDocktorClient = require('../src/clients/TimeDocktorClient');
const apiConfig = require('../src/config/apiConfig');

// Set environment from command line argument
const environment = process.argv[2] || 'local';
apiConfig.setEnvironment(environment);

// Create client instance
const client = new TimeDocktorClient({
  baseURL: apiConfig.getCurrentEndpoint().baseURL,
  debug: true
});

console.log('\n========================================');
console.log(`Time Doctor API Client Example`);
console.log(`Environment: ${environment}`);
console.log(`API URL: ${apiConfig.getCurrentEndpoint().baseURL}`);
console.log('========================================\n');

// Helper function to print results
function printResult(title, data) {
  console.log(`\n📊 ${title}:`);
  console.log(JSON.stringify(data, null, 2));
}

// Helper function to handle errors
function handleError(operation, error) {
  console.error(`\n❌ Error during ${operation}:`);
  console.error(error.message);
}

// Main example flow
async function runExamples() {
  try {
    // 1. Login
    console.log('\n1️⃣ Logging in...');
    const credentials = apiConfig.getTestCredentials();
    
    if (!credentials.email || !credentials.password) {
      console.error('\n⚠️ No credentials configured!');
      console.log('For production, set environment variables:');
      console.log('  export TIMEDOCTOR_EMAIL="your-email@example.com"');
      console.log('  export TIMEDOCTOR_PASSWORD="your-password"');
      return;
    }

    const loginResponse = await client.login(credentials.email, credentials.password);
    printResult('Login Response', {
      token: loginResponse.token ? `${loginResponse.token.substring(0, 20)}...` : null,
      user: loginResponse.user
    });

    // 2. Get current user
    console.log('\n2️⃣ Getting current user...');
    try {
      const me = await client.getMe();
      printResult('Current User', me);
    } catch (error) {
      console.log('getMe endpoint not available, skipping...');
    }

    // 3. Get users
    console.log('\n3️⃣ Getting users...');
    const users = await client.getUsers();
    printResult('Users', users);

    // 4. Get projects
    console.log('\n4️⃣ Getting projects...');
    const projects = await client.getProjects();
    printResult('Projects', projects);

    // 5. Get tasks
    console.log('\n5️⃣ Getting tasks...');
    const tasks = await client.getTasks();
    printResult('Tasks', tasks);

    // 6. Get worklogs (time entries)
    console.log('\n6️⃣ Getting worklogs...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const worklogs = await client.getWorklogs({
      from: yesterday.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
    printResult('Recent Worklogs', worklogs);

    // 7. Create a test project (only in local environment)
    if (environment === 'local') {
      console.log('\n7️⃣ Creating test project...');
      const newProject = await client.createProject({
        name: `Test Project ${Date.now()}`,
        description: 'Created via API example',
        start_date: today.toISOString(),
        end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      printResult('New Project', newProject);

      // 8. Create a test task
      console.log('\n8️⃣ Creating test task...');
      const newTask = await client.createTask({
        project_id: newProject.data ? newProject.data._id : 'test_project',
        title: `Test Task ${Date.now()}`,
        description: 'Created via API example',
        priority: 'medium'
      });
      printResult('New Task', newTask);

      // 9. Start time tracking
      console.log('\n9️⃣ Starting time tracking...');
      const worklog = await client.startTracking(
        newProject.data ? newProject.data._id : 'test_project',
        newTask.data ? newTask.data._id : 'test_task',
        'Working on API testing'
      );
      printResult('Time Tracking Started', worklog);

      // 10. Stop time tracking
      if (worklog.data && worklog.data.id) {
        console.log('\n🔟 Stopping time tracking...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const stoppedLog = await client.stopTracking(worklog.data.id);
        printResult('Time Tracking Stopped', stoppedLog);
      }
    } else {
      console.log('\n⚠️ Skipping create operations in production environment');
    }

    // 11. Get reports
    console.log('\n📈 Getting reports...');
    try {
      const summaryReport = await client.getSummaryReport({
        from: yesterday.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      });
      printResult('Summary Report', summaryReport);
    } catch (error) {
      console.log('Report endpoint error:', error.message);
    }

    // 12. Get current configuration
    console.log('\n⚙️ Current Configuration:');
    console.log(client.getConfig());

    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    handleError('example execution', error);
    console.log('\nTip: Make sure the server is running if using local environment.');
    console.log('     Run: npm start');
  }
}

// Interactive menu
function showMenu() {
  console.log('\n📋 Available Examples:');
  console.log('1. Run all examples');
  console.log('2. Test login only');
  console.log('3. Get worklogs only');
  console.log('4. Switch environment');
  console.log('5. Exit');
  console.log('\nPress Ctrl+C to exit at any time');
}

// Simple interactive mode
async function interactive() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  while (true) {
    showMenu();
    const choice = await question('\nSelect option (1-5): ');

    switch (choice.trim()) {
      case '1':
        await runExamples();
        break;
      
      case '2':
        try {
          const creds = apiConfig.getTestCredentials();
          const loginResp = await client.login(creds.email, creds.password);
          printResult('Login Test', loginResp);
        } catch (error) {
          handleError('login', error);
        }
        break;
      
      case '3':
        try {
          if (!client.isAuthenticated()) {
            console.log('Please login first (option 2)');
          } else {
            const logs = await client.getWorklogs();
            printResult('Worklogs', logs);
          }
        } catch (error) {
          handleError('get worklogs', error);
        }
        break;
      
      case '4':
        const newEnv = environment === 'local' ? 'production' : 'local';
        apiConfig.setEnvironment(newEnv);
        client.baseURL = apiConfig.getCurrentEndpoint().baseURL;
        console.log(`Switched to ${newEnv} environment`);
        break;
      
      case '5':
        console.log('\nGoodbye! 👋');
        rl.close();
        process.exit(0);
      
      default:
        console.log('Invalid option. Please try again.');
    }
  }
}

// Run based on command line arguments
if (process.argv.includes('--interactive') || process.argv.includes('-i')) {
  interactive();
} else {
  runExamples();
}