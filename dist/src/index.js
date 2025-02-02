import ClaudeSystem from './ClaudeSystem.js';
import { createLogger, format, transports } from 'winston';
// Initialize logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple())
        }),
        new transports.File({
            filename: 'logs/system.log',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
});
// Create and start server
async function startServer() {
    try {
        const system = new ClaudeSystem();
        // Handle shutdown signals
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received. Starting graceful shutdown...');
            await system.stop();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger.info('SIGINT received. Starting graceful shutdown...');
            await system.stop();
            process.exit(0);
        });
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection:', reason);
            process.exit(1);
        });
        // Start the system
        await system.start();
        logger.info('System started successfully');
    }
    catch (error) {
        logger.error('Failed to start system:', error);
        process.exit(1);
    }
}
// Start the server
startServer().catch((error) => {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map