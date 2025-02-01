import express, { Express } from 'express';
import { json } from 'express';
import { createLogger, format, transports } from 'winston';
import { AnthropicService } from './services/AnthropicService.js';
import { LearningSystem } from './services/LearningSystem.js';
import { ToolInitializer } from './services/ToolInitializer.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize logger with enhanced format for learning system
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.metadata(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: 'logs/server.log',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    }),
    new transports.File({ 
      filename: 'logs/interactions.log',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ]
});

// Initialize tool system
const toolInitializer = ToolInitializer.getInstance(logger);
const learningSystem = new LearningSystem(logger, toolInitializer.getToolRegistry());

// Create Express app
const app: Express = express();

// Initialize tools and start server
toolInitializer.initialize(logger, learningSystem).then(toolRegistry => {
  // Initialize Anthropic service
  const anthropicService = new AnthropicService(logger, toolRegistry);

  app.use(json());

  // Middleware to log requests
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      body: req.body
    });
    next();
  });

  // Get available tools
  app.get('/tools', (req, res) => {
    const metadata = toolRegistry.getAllToolMetadata();
    res.json({ tools: metadata });
  });

  // Execute tool
  app.post('/execute/:tool', async (req, res) => {
    const { tool } = req.params;
    const params = req.body;

    try {
      const result = await toolRegistry.executeTool(tool, params);
      
      // Log successful tool execution
      await learningSystem.logInteraction({
        user_input: `Execute tool: ${tool}`,
        system_prompt: '',
        claude_response: '',
        tools_used: [{
          name: tool,
          params,
          result
        }],
        success: true,
        context: {
          system_state: {},
          memory_state: {},
          tool_state: {}
        }
      });

      res.json(result);
    } catch (error: any) {
      // Log failed tool execution
      await learningSystem.logInteraction({
        user_input: `Execute tool: ${tool}`,
        system_prompt: '',
        claude_response: '',
        tools_used: [{
          name: tool,
          params,
          result: null
        }],
        success: false,
        error: {
          type: 'tool_execution_error',
          message: error.message
        },
        context: {
          system_state: {},
          memory_state: {},
          tool_state: {}
        }
      });

      logger.error('Tool execution error', { tool, params, error });
      res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Process command with Claude
  app.post('/command', async (req, res) => {
    const { command } = req.body;

    try {
      const result = await anthropicService.processCommand(command);
      res.json({ result });
    } catch (error: any) {
      logger.error('Command processing error', { command, error });
      res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info('Available tools:', toolRegistry.getToolNames());
  });

  // Handle cleanup
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    await toolInitializer.cleanup();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Starting graceful shutdown...');
    await toolInitializer.cleanup();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  // Run periodic log analysis
  setInterval(async () => {
    try {
      const analysis = await learningSystem.analyzeRecentLogs(24);
      logger.info('Log analysis complete', { analysis });
    } catch (error) {
      logger.error('Failed to analyze logs', error);
    }
  }, 60 * 60 * 1000); // Every hour

}).catch(error => {
  logger.error('Failed to initialize tools:', error);
  process.exit(1);
});

export default app;