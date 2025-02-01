import readline from 'node:readline';
import axios from 'axios';
import { createInterface } from 'node:readline/promises';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let user = null;
let session = null;
const baseUrl = 'http://localhost:3002';

async function login() {
  console.log('Welcome to Claude System CLI');
  console.log('Please log in to continue.\n');

  const username = await rl.question('Username: ');
  const password = await rl.question('Password: ');

  try {
    const response = await axios.post(`${baseUrl}/login`, {
      username,
      password
    });

    user = response.data.user;
    session = response.data.session;
    console.log('\nLogin successful!\n');
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function executeCommand(command) {
  try {
    const response = await axios.post(`${baseUrl}/command`, {
      command,
      user,
      session
    });

    if (response.data.success) {
      console.log('\nCommand executed successfully!');
      if (response.data.result?.data) {
        console.log('\nResult:');
        console.log(JSON.stringify(response.data.result.data, null, 2));
      }
    } else {
      console.log('\nCommand failed:', response.data.message);
    }
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

async function showHelp() {
  console.log(`
Available commands:

File Operations:
  - create file <path> with content <content>
  - read file <path>
  - delete file <path>

System Settings:
  - get system setting screen_resolution

Command Execution:
  - run command <command>
  Example: run command dir

App Control:
  - launch <app>
  - close <app>
  Example: launch notepad

Type 'exit' to quit
Type 'help' to show this message again
`);
}

async function main() {
  if (!await login()) {
    console.log('Exiting due to login failure');
    process.exit(1);
  }

  await showHelp();

  while (true) {
    const command = await rl.question('\nEnter command: ');
    
    if (command.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      break;
    }

    if (command.toLowerCase() === 'help') {
      await showHelp();
      continue;
    }

    await executeCommand(command);
  }

  rl.close();
}

// Start the CLI
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});