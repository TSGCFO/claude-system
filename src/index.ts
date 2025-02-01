import { ClaudeSystem, createServer } from './ClaudeSystem.js';
import { createLogger, format, transports } from 'winston';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize logger
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/system.log' }),
    new transports.Console({ 
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

async function main() {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = join(__dirname, '..', 'logs');
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }

    // Initialize the Claude System
    logger.info('Initializing Claude System...');
    const system = new ClaudeSystem();

    // Create and start the server
    const app = createServer(system);
    const PORT = process.env.PORT || 3002; // Changed to port 3002

    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info('Claude System is ready to accept commands');
    });

    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });

    // Handle shutdown gracefully
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Starting graceful shutdown...');
      await system.shutdown();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received. Starting graceful shutdown...');
      await system.shutdown();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start Claude System:', error);
    process.exit(1);
  }
}

// Start the application
logger.info('Starting Claude System...');
main().catch(error => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});