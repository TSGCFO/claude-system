import fetch from 'node-fetch';

/**
 * Example script demonstrating how to interact with the Claude Assistant
 */

class AssistantClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a command to the assistant
   */
  async sendCommand(command: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Command failed: ${error.error}`);
    }

    return response.json();
  }

  /**
   * Execute a specific tool
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/tool/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tool execution failed: ${error.error}`);
    }

    return response.json();
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/health`);
    const health = await response.json();
    return health.status === 'healthy' && health.initialized;
  }
}

async function main() {
  // Create assistant client
  const assistant = new AssistantClient();

  try {
    // Check system health
    console.log('Checking system health...');
    const healthy = await assistant.checkHealth();
    if (!healthy) {
      throw new Error('System is not healthy');
    }
    console.log('System is healthy');

    // Example 1: Simple command
    console.log('\nExample 1: Simple command');
    const weatherResult = await assistant.sendCommand(
      'What is the weather in San Francisco?'
    );
    console.log('Response:', weatherResult);

    // Example 2: Using browser tool
    console.log('\nExample 2: Using browser tool');
    await assistant.executeTool('browser', {
      action: 'launch',
      url: 'https://example.com'
    });
    
    await assistant.executeTool('browser', {
      action: 'type',
      text: 'Hello, World!'
    });
    
    await assistant.executeTool('browser', {
      action: 'close'
    });

    // Example 3: File operations
    console.log('\nExample 3: File operations');
    const fileResult = await assistant.sendCommand(
      'Create a file called test.txt with the content "Hello from Claude!"'
    );
    console.log('Response:', fileResult);

    // Example 4: System command
    console.log('\nExample 4: System command');
    const listResult = await assistant.sendCommand(
      'List all files in the current directory'
    );
    console.log('Response:', listResult);

    // Example 5: Complex task
    console.log('\nExample 5: Complex task');
    const analysisResult = await assistant.sendCommand(`
      Please analyze the code in src/index.ts:
      1. List the main functions
      2. Identify potential improvements
      3. Suggest any security enhancements
    `);
    console.log('Response:', analysisResult);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

export { AssistantClient };