# Usage Guide

## Setup and Installation

1. Install Dependencies
```bash
npm install
```

2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Required settings:
ANTHROPIC_API_KEY=your_api_key_here
PORT=3000  # Port for the server
LOG_LEVEL=info  # Logging level (debug, info, warn, error)
```

3. Create Required Directories
```bash
# Create necessary directories
mkdir -p logs/metrics
mkdir -p config/roles
```

## Running the Assistant

1. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

2. Verify Server Status
```bash
# Check health endpoint
curl http://localhost:3000/health
```

## Interacting with the Assistant

### Using the API

1. Send Commands
```bash
# Send a command to the assistant
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{
    "command": "What is the weather in San Francisco?"
  }'
```

2. Use Tools
```bash
# Execute a specific tool
curl -X POST http://localhost:3000/api/tool/browser \
  -H "Content-Type: application/json" \
  -d '{
    "action": "launch",
    "url": "https://example.com"
  }'
```

### Response Format

The assistant's responses will include:

```json
{
  "response": "The response content",
  "metrics": {
    "responseTime": 123,
    "confidence": 0.95,
    "quality": {
      "accuracy": 0.9,
      "completeness": 0.95,
      "consistency": 0.92
    }
  },
  "context": {
    "role": "technical-expert",
    "tools_used": ["browser", "weather-api"]
  }
}
```

### Error Handling

Error responses include detailed information:

```json
{
  "error": "Error message",
  "type": "ErrorType",
  "details": "Additional error details"
}
```

## Monitoring and Metrics

1. View Performance Metrics
```bash
# Get current metrics
curl http://localhost:3000/metrics
```

2. Check Logs
```bash
# View system logs
tail -f logs/system.log

# View metrics logs
tail -f logs/metrics/metrics-*.json

# View interaction logs
tail -f logs/interactions/*.json
```

## Configuration

### Role Configuration

Create role definitions in `config/roles/`:

```json
// config/roles/technical-expert.json
{
  "name": "technical-expert",
  "expertise": ["software-development", "system-architecture"],
  "capabilities": ["code-analysis", "technical-writing"],
  "constraints": {
    "maxComplexity": 8,
    "allowedTools": ["all"],
    "responseFormat": ["text", "code", "json"]
  }
}
```

### Quality Settings

Adjust quality thresholds in `.env`:

```bash
QUALITY_MIN_ACCURACY=0.8
QUALITY_MIN_COMPLETENESS=0.9
QUALITY_MIN_CONSISTENCY=0.85
QUALITY_MIN_RELEVANCE=0.8
QUALITY_MIN_CONFIDENCE=0.7
```

### Performance Monitoring

Configure monitoring settings in `.env`:

```bash
MONITOR_RESPONSE_TIME_THRESHOLD=2000
MONITOR_MEMORY_THRESHOLD=0.8
MONITOR_CPU_THRESHOLD=0.7
MONITOR_ERROR_RATE_THRESHOLD=0.1
MONITOR_CHECK_INTERVAL=60000
```

## Development and Testing

1. Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

2. Development Mode
```bash
# Start in development mode with hot reloading
npm run dev
```

3. Linting and Type Checking
```bash
# Run linter
npm run lint

# Run type checker
npm run type-check
```

## Troubleshooting

1. Check System Status
```bash
# View system health
curl http://localhost:3000/health

# Check logs for errors
grep ERROR logs/system.log
```

2. Common Issues

- **Connection Issues**
  ```bash
  # Check if server is running
  lsof -i :3000
  ```

- **Performance Issues**
  ```bash
  # View recent performance metrics
  tail -n 100 logs/metrics/metrics-*.json
  ```

- **Tool Errors**
  ```bash
  # Check tool effectiveness logs
  cat logs/analysis/tool_effectiveness.json
  ```

## Best Practices

1. **Command Structure**
   - Be specific and clear in commands
   - Include relevant context
   - Specify desired output format when needed

2. **Tool Usage**
   - Check tool availability before use
   - Handle tool-specific errors appropriately
   - Monitor tool effectiveness metrics

3. **Error Handling**
   - Implement proper error handling in clients
   - Check error types and details
   - Use appropriate retry strategies

4. **Performance Optimization**
   - Monitor response times
   - Check resource usage
   - Review and adjust quality thresholds as needed

## Support

For issues and support:
1. Check the logs for error messages
2. Review the documentation
3. Submit detailed bug reports with logs and reproduction steps