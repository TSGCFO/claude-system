import axios from 'axios';

async function testClaudeSystem() {
  try {
    const baseUrl = 'http://localhost:3000';

    // Login
    console.log('Testing login...');
    const loginResponse = await axios.post(`${baseUrl}/login`, {
      username: 'testuser',
      password: 'testpass'
    });

    const { user, session } = loginResponse.data;
    console.log('Login successful:', { userId: user.id, sessionId: session.id });

    // Test file operation
    console.log('\nTesting file operation...');
    const fileCommand = await axios.post(`${baseUrl}/command`, {
      command: 'create file test.txt with content Hello, Claude!',
      user,
      session
    });
    console.log('File operation result:', fileCommand.data);

    // Test web navigation
    console.log('\nTesting web navigation...');
    const webCommand = await axios.post(`${baseUrl}/command`, {
      command: 'go to https://example.com',
      user,
      session
    });
    console.log('Web navigation result:', webCommand.data);

    // Test system command
    console.log('\nTesting system command...');
    const sysCommand = await axios.post(`${baseUrl}/command`, {
      command: 'get system setting screen_resolution',
      user,
      session
    });
    console.log('System command result:', sysCommand.data);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Test failed:', error.response?.data || error.message);
    } else {
      console.error('Test failed:', error);
    }
  }
}

// Run the test
testClaudeSystem();