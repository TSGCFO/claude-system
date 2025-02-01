import axios from 'axios';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure axios to include more error details
axios.defaults.validateStatus = false; // Don't throw on any status
axios.interceptors.request.use(request => {
  console.log('Making request:', {
    method: request.method,
    url: request.url,
    data: request.data
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Received response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  error => {
    if (error.response) {
      console.error('Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('Request Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
);

async function ensureTestDirectory() {
  try {
    const testDir = join(process.cwd(), 'test-files');
    console.log('Creating test directory:', testDir);
    await fs.mkdir(testDir, { recursive: true });
    console.log('Test directory created successfully');
    return testDir;
  } catch (error) {
    console.error('Error creating test directory:', error);
    throw error;
  }
}

async function testClaudeSystem() {
  try {
    const baseUrl = 'http://localhost:3002'; // Updated to port 3002
    console.log('Testing Claude System API at:', baseUrl);

    // Test login
    console.log('\nTesting login endpoint...');
    const loginResponse = await axios.post(`${baseUrl}/login`, {
      username: 'testuser',
      password: 'testpass'
    });
    console.log('Login successful:', JSON.stringify(loginResponse.data, null, 2));

    const { user, session } = loginResponse.data;

    // Prepare test directory
    const testDir = await ensureTestDirectory();
    console.log('\nTest directory ready:', testDir);

    // Test commands
    const commands = [
      {
        name: 'File Operation',
        command: `create file ${join(testDir, 'test.txt')} with content Hello, Claude!`
      },
      {
        name: 'System Settings',
        command: 'get system setting screen_resolution'
      },
      {
        name: 'Command Execution',
        command: 'run command dir'
      }
    ];

    console.log('\nExecuting test commands...');
    for (const { name, command } of commands) {
      try {
        console.log(`\n=== Testing ${name} ===`);
        console.log(`Command: ${command}`);
        
        const commandResponse = await axios.post(`${baseUrl}/command`, {
          command,
          user,
          session
        });

        console.log('Command response:', JSON.stringify(commandResponse.data, null, 2));

        if (!commandResponse.data.success) {
          console.warn('Command did not succeed:', commandResponse.data.message);
        } else if (commandResponse.data.result) {
          console.log('Operation result:', commandResponse.data.result);
        }

        // Add delay between commands
        console.log('Waiting before next command...');
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (cmdError) {
        console.error(`Error executing ${name}:`, {
          message: cmdError.message,
          response: cmdError.response?.data,
          stack: cmdError.stack
        });
      }
    }

    console.log('\nTest suite completed successfully.');

  } catch (error) {
    console.error('\nTest suite failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    process.exit(1);
  }
}

console.log('Starting Claude System tests...');
testClaudeSystem().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});