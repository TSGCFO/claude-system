import { ComputerControlClient } from './client.js';

async function testSystem() {
  const client = new ComputerControlClient();
  
  try {
    console.log('Getting available tools...');
    const tools = await client.getTools();
    console.log('Available tools:', tools.map(t => t.name));

    // Test file operations
    console.log('\nTesting file operations...');
    await client.executeTool('write_file', {
      path: 'test.txt',
      content: 'Hello from Claude!'
    });
    console.log('Created test file');

    const content = await client.executeTool('read_file', {
      path: 'test.txt'
    });
    console.log('Read file content:', content.data);

    // Test web navigation
    console.log('\nTesting web navigation...');
    await client.executeTool('navigate_web', {
      url: 'https://example.com'
    });
    console.log('Navigated to website');

    const pageContent = await client.executeTool('get_page_content', {});
    console.log('Got page content length:', pageContent.data.length);

    // Test system operations
    console.log('\nTesting system operations...');
    const sysInfo = await client.executeTool('get_system_info', {});
    console.log('System info:', sysInfo.data);

    // Cleanup
    console.log('\nCleaning up...');
    await client.executeTool('delete_file', {
      path: 'test.txt'
    });
    console.log('Deleted test file');

    console.log('\nAll tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
console.log('Starting system tests...');
testSystem().catch(console.error);