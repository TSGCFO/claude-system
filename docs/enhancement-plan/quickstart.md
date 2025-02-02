# Quick Start Guide

## 1. Installation

```bash
# Clone the repository (if you haven't already)
git clone [repository-url]
cd claude-system

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## 2. Configuration

Edit `.env` file with your settings:
```env
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional (defaults shown)
PORT=3000
LOG_LEVEL=info
```

## 3. Start the Assistant

```bash
# Start in development mode
npm run dev

# The assistant will be available at http://localhost:3000
```

## 4. Basic Usage

### Send a Command

```bash
# Using curl
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "What is the current time in Tokyo?"
  }'

# Using Node.js
const response = await fetch('http://localhost:3000/api/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'What is the current time in Tokyo?' })
});
const result = await response.json();
```

### Use a Tool

```bash
# Example: Using the browser tool
curl -X POST http://localhost:3000/api/tool/browser \
  -H "Content-Type: application/json" \
  -d '{
    "action": "launch",
    "url": "https://example.com"
  }'
```

## 5. Available Tools

- **Browser Tool**: Web automation and browsing
  ```json
  {
    "action": "launch|click|type|scroll_down|scroll_up|close",
    "url": "for launch action",
    "coordinate": "for click action",
    "text": "for type action"
  }
  ```

- **File Tool**: File system operations
  ```json
  {
    "action": "read|write|search|list",
    "path": "file or directory path",
    "content": "for write action"
  }
  ```

- **System Tool**: System operations
  ```json
  {
    "action": "execute",
    "command": "CLI command to execute"
  }
  ```

## 6. Example Interactions

### Web Search
```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Search for the latest news about artificial intelligence"
  }'
```

### File Creation
```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "Create a new file called hello.txt with the content 'Hello, World!'"
  }'
```

### System Command
```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "List all files in the current directory"
  }'
```

## 7. Monitoring

Check system health:
```bash
curl http://localhost:3000/health
```

View logs:
```bash
# System logs
tail -f logs/system.log

# Metrics
tail -f logs/metrics/metrics-*.json
```

## 8. Common Issues

1. **Connection Refused**
   - Check if the server is running
   - Verify the correct port in .env

2. **Authentication Failed**
   - Verify ANTHROPIC_API_KEY in .env
   - Check API key permissions

3. **Tool Execution Failed**
   - Check tool-specific permissions
   - Verify tool parameters

## 9. Next Steps

- Read the full [Usage Guide](usage.md) for detailed information
- Explore available [Tools Documentation](../tools/README.md)
- Review [Security Guidelines](../security/README.md)
- Check [API Documentation](../api/README.md)

## 10. Support

For issues and questions:
1. Check the logs (`logs/system.log`)
2. Review error messages and stack traces
3. Consult the documentation
4. Submit detailed bug reports if needed