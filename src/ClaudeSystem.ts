import { SecurityManager } from './security/SecurityManager.js';
import { NaturalLanguageInterface } from './nli/NaturalLanguageInterface.js';
import { OperationExecutor } from './executor/OperationExecutor.js';
import { NLIRequest, Operation, User, Session } from './types/core.js';
import { createLogger, Logger, format, transports } from 'winston';
import express from 'express';
import { json } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export class ClaudeSystem {
  private securityManager: SecurityManager;
  private nli: NaturalLanguageInterface;
  private executor: OperationExecutor;
  private logger: Logger;

  constructor() {
    // Initialize logger
    this.logger = createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/system.log' }),
        new transports.Console({ format: format.simple() })
      ]
    });

    this.logger.info('Initializing Claude System components...');

    // Initialize components
    try {
      this.securityManager = new SecurityManager();
      this.nli = new NaturalLanguageInterface();
      this.executor = new OperationExecutor(this.securityManager);

      // Start security cleanup tasks
      this.securityManager.startSessionCleanup();
      
      this.logger.info('All components initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize components', { error });
      throw error;
    }
  }

  /**
   * Process a natural language command
   */
  async processCommand(
    command: string,
    user: User,
    session: Session
  ): Promise<{ success: boolean; message: string; error?: Error; result?: any }> {
    try {
      this.logger.info('Processing command', { command, userId: user.id, sessionId: session.id });

      // Validate session
      const sessionValid = await this.securityManager.validateSession(session.id);
      if (!sessionValid) {
        throw new Error('Invalid or expired session');
      }

      // Process natural language input
      const nliRequest: NLIRequest = {
        text: command,
        context: {
          user,
          session,
          timestamp: new Date()
        }
      };

      const nliResponse = await this.nli.processInput(nliRequest);
      this.logger.debug('NLI response', { nliResponse });

      // Handle clarification needs
      if (nliResponse.clarificationNeeded) {
        return {
          success: false,
          message: nliResponse.clarificationQuestion || 'Could not understand command'
        };
      }

      // Validate operation exists
      if (!nliResponse.operation) {
        return {
          success: false,
          message: 'Failed to generate operation from command'
        };
      }

      // Check operation authorization
      const authorized = await this.securityManager.authorizeOperation(
        nliResponse.operation,
        user
      );

      if (!authorized) {
        return {
          success: false,
          message: 'Not authorized to perform this operation'
        };
      }

      // Execute operation
      await this.executor.executeOperation(nliResponse.operation);

      return {
        success: true,
        message: 'Operation completed successfully',
        result: {
          operationId: nliResponse.operation.id,
          type: nliResponse.operation.type,
          status: nliResponse.operation.status,
          data: nliResponse.operation.context.result
        }
      };
    } catch (error) {
      // Log error
      this.logger.error('Command processing error', {
        command,
        userId: user.id,
        sessionId: session.id,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });

      return {
        success: false,
        message: 'Failed to process command',
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  /**
   * Authenticate user and create session
   */
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<{ user: User; session: Session }> {
    try {
      this.logger.info('Processing login request', { username: credentials.username });
      
      const session = await this.securityManager.authenticate(credentials);
      
      // TODO: Replace with actual user lookup
      const user: User = {
        id: session.userId,
        permissions: [
          'FILE_READ',
          'FILE_WRITE',
          'SYSTEM_SETTINGS',
          'APP_CONTROL',
          'WEB_ACCESS',
          'COMMAND_EXEC'
        ]
      };

      this.logger.info('Login successful', { userId: user.id, sessionId: session.id });
      return { user, session };
    } catch (error) {
      this.logger.error('Login error', { 
        username: credentials.username,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }

  /**
   * Clean up system resources
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Starting system shutdown...');
      await this.executor.cleanup();
      this.logger.info('System shutdown completed');
    } catch (error) {
      this.logger.error('Shutdown error', { error });
      throw error;
    }
  }
}

export function createServer(system: ClaudeSystem) {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(json());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }));

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });

  // Login endpoint
  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await system.login({ username, password });
      res.json(result);
    } catch (error) {
      res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Command endpoint
  app.post('/command', async (req, res) => {
    try {
      const { command, user, session } = req.body;
      const result = await system.processCommand(command, user, session);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Command processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return app;
}