# Claude Assistant Examples

This directory contains example scripts demonstrating how to use the Claude Assistant.

## Available Examples

### 1. assistant-demo.ts
A TypeScript example showing how to:
- Connect to the assistant
- Send commands
- Use tools
- Handle errors
- Perform complex tasks

## Running the Examples

1. **Setup**
```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build
```

2. **Run the Demo**
```bash
# Using ts-node (for development)
npx ts-node examples/assistant-demo.ts

# Using node (after building)
node dist/examples/assistant-demo.js
```

## Modifying the Examples

### Adding New Commands

```typescript
// Add to assistant-demo.ts
const result = await assistant.sendCommand(
  'Your command here'
);
console.log('Response:', result);
```

### Using Different Tools

```typescript
// Browser tool example
await assistant.executeTool('browser', {
  action: 'launch',
  url: 'https://your-url.com'
});

// File tool example
await assistant.executeTool('file', {
  action: 'write',
  path: 'your-file.txt',
  content: 'Your content'
});

// System tool example
await assistant.executeTool('system', {
  action: 'execute',
  command: 'your command'
});
```

### Error Handling

```typescript
try {
  const result = await assistant.sendCommand('your command');
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Handle specific error types
  if (error.message.includes('not initialized')) {
    // Handle initialization error
  } else if (error.message.includes('tool execution failed')) {
    // Handle tool error
  }
}
```

### Custom Client Configuration

```typescript
// Configure custom base URL
const assistant = new AssistantClient('http://your-server:3000');

// Add custom headers
class CustomAssistantClient extends AssistantClient {
  async sendCommand(command: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value'
      },
      body: JSON.stringify({ command })
    });
    return response.json();
  }
}
```

## Best Practices

1. **Error Handling**
   - Always wrap commands in try/catch blocks
   - Handle specific error types appropriately
   - Log errors for debugging

2. **Resource Management**
   - Close resources like browser sessions
   - Clean up temporary files
   - Handle process termination

3. **Performance**
   - Reuse the client instance
   - Batch related commands when possible
   - Monitor response times

4. **Security**
   - Validate input data
   - Handle sensitive information securely
   - Use environment variables for configuration

## Testing

```typescript
import { AssistantClient } from './assistant-demo';

describe('AssistantClient', () => {
  let assistant: AssistantClient;

  beforeEach(() => {
    assistant = new AssistantClient();
  });

  test('should send command successfully', async () => {
    const result = await assistant.sendCommand('test command');
    expect(result).toBeDefined();
  });

  test('should handle errors properly', async () => {
    await expect(
      assistant.sendCommand('')
    ).rejects.toThrow('Command failed');
  });
});
```

## Debugging

1. **Enable Debug Logging**
```typescript
const assistant = new AssistantClient();
assistant.setLogLevel('debug');
```

2. **Check System Health**
```typescript
const healthy = await assistant.checkHealth();
console.log('System health:', healthy);
```

3. **Monitor Tool Usage**
```typescript
// View tool effectiveness
const toolStats = await assistant.executeTool('system', {
  action: 'execute',
  command: 'cat logs/analysis/tool_effectiveness.json'
});
console.log('Tool stats:', toolStats);
```

## Support

For issues and questions:
1. Check the error message and logs
2. Review the documentation
3. Try the debugging steps
4. Submit detailed bug reports if needed