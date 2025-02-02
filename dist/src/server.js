import express from 'express';
import { json } from 'express';
import { createLogger, format, transports } from 'winston';
import { corsMiddleware, handlePreflight } from './middleware/cors.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { ToolInitializer } from './services/ToolInitializer.js';
import { LearningSystem } from './services/LearningSystem.js';
import { SecurityManager } from './security/SecurityManager.js';
import { createAuthRouter } from './routes/auth.js';
// Load environment variables
config();
// Initialize logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple())
        }),
        new transports.File({
            filename: 'logs/server.log',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
});
// Initialize components
const app = express();
const toolInitializer = ToolInitializer.getInstance(logger);
const securityManager = new SecurityManager(logger);
let toolRegistry;
let learningSystem;
async function initializeSystem() {
    try {
        // Initialize tool registry
        toolRegistry = await toolInitializer.initialize(logger);
        // Initialize learning system
        learningSystem = new LearningSystem(logger, toolRegistry);
        // Reinitialize with learning system
        toolRegistry = await toolInitializer.reinitialize(logger, learningSystem);
        logger.info('System initialized successfully');
    }
    catch (error) {
        logger.error('Failed to initialize system:', error);
        throw error;
    }
}
// Middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(json());
app.use(corsMiddleware);
app.use(handlePreflight);
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined'));
// Routes
// Auth routes
app.use('/api/auth', createAuthRouter(logger, securityManager));
// Tool routes
app.post('/api/tool/:name', async (req, res) => {
    try {
        const { name: tool } = req.params;
        const params = req.body;
        const result = await toolRegistry.executeTool(tool, params);
        // Log successful interaction
        await learningSystem.logInteraction({
            command: `Tool execution: ${tool}`,
            response: JSON.stringify(result),
            tools_used: [tool],
            success: true,
            duration: 0 // You might want to add timing logic
        });
        res.json(result);
    }
    catch (error) {
        // Log failed interaction
        await learningSystem.logInteraction({
            command: `Tool execution: ${req.params.name}`,
            response: error.message,
            tools_used: [req.params.name],
            success: false,
            error: error.message,
            duration: 0 // You might want to add timing logic
        });
        res.status(500).json({ error: error.message });
    }
});
// Error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
const port = process.env.PORT || 3000;
initializeSystem()
    .then(() => {
    app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
    });
})
    .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
// Handle cleanup
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    await toolInitializer.cleanup();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received. Starting graceful shutdown...');
    await toolInitializer.cleanup();
    process.exit(0);
});
//# sourceMappingURL=server.js.map