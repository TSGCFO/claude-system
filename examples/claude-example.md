# Claude Computer Control Example

This example shows how Claude can use the computer control tools to perform tasks. The tools are exposed through an HTTP API that Claude can interact with.

## Available Tools

1. File Operations:
   - `read_file`: Read file contents
   - `write_file`: Write content to a file
   - `list_files`: List files in a directory
   - `delete_file`: Delete a file
   - `search_file_content`: Search for text in files

2. Browser Control:
   - `navigate_web`: Open and navigate to websites
   - `click_element`: Click elements on webpages
   - `type_text`: Type text into input fields
   - `get_page_content`: Get webpage content
   - `take_screenshot`: Take screenshots

3. System Operations:
   - `execute_command`: Run system commands
   - `launch_application`: Start applications
   - `get_system_info`: Get system information
   - `process_control`: Manage system processes

## Example Usage

Here's how Claude can use these tools:

```typescript
// First, get the list of available tools
GET http://localhost:3000/tools

// Execute a tool
POST http://localhost:3000/execute/read_file
{
  "path": "example.txt"
}

// Navigate to a website
POST http://localhost:3000/execute/navigate_web
{
  "url": "https://example.com"
}

// Click a button
POST http://localhost:3000/execute/click_element
{
  "selector": "#submit-button"
}

// Execute a system command
POST http://localhost:3000/execute/execute_command
{
  "command": "dir"
}
```

## Example Tasks

Here are some example tasks Claude can perform:

1. Web Research:
```typescript
// Navigate to a website
await client.executeTool('navigate_web', { url: 'https://example.com' });

// Get page content
const content = await client.executeTool('get_page_content', {});

// Save the research results
await client.executeTool('write_file', {
  path: 'research-results.txt',
  content: content.data
});
```

2. System Management:
```typescript
// Get system information
const sysInfo = await client.executeTool('get_system_info', {});

// List running processes
const processes = await client.executeTool('process_control', {
  action: 'list'
});

// Launch an application
await client.executeTool('launch_application', {
  name: 'notepad'
});
```

3. File Operations:
```typescript
// List files in a directory
const files = await client.executeTool('list_files', {
  path: './documents',
  recursive: true
});

// Search for specific content
const searchResults = await client.executeTool('search_file_content', {
  path: './documents',
  pattern: 'important',
  filePattern: '*.txt'
});
```

## Security Considerations

1. The tools run with the same permissions as the user running the server.
2. Claude should validate user intent before executing potentially dangerous operations.
3. File operations are restricted to the current working directory by default.
4. System commands should be carefully validated before execution.

## Using in Claude Prompts

When asking Claude to use these tools, provide clear instructions about what you want to accomplish. For example:

"Please help me organize my documents folder by:
1. Listing all text files
2. Searching for files containing 'project'
3. Creating a summary document with the findings"

Claude can then use the appropriate tools to accomplish these tasks while keeping you informed of its progress and any issues encountered.