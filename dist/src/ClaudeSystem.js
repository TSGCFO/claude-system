import express from 'express';
import { json } from 'express';
import { createLogger, format, transports } from 'winston';
import cors from 'cors';
import * as path from 'path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { SecurityManager } from './security/SecurityManager.js';
import { ToolRegistry } from './tools/Tool.js';
import { AnthropicService } from './services/AnthropicService.js';
import { LearningSystem } from './services/LearningSystem.js';
import { PromptManager } from './services/PromptManager.js';
import { ToolInitializer } from './services/ToolInitializer.js';
import { PerformanceMonitor } from './monitoring/PerformanceMonitor.js';
import { QualityController } from './quality/QualityController.js';
import { RoleManager } from './roles/RoleManager.js';
// Load environment variables
config();
class ClaudeSystem {
    constructor() {
        // Initialize logger
        this.logger = createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: format.combine(format.timestamp(), format.json()),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'logs/system.log' })
            ]
        });
        // Initialize Express app
        this.app = express();
        // Initialize properties with default values
        this.initialized = false;
        this.toolRegistry = new ToolRegistry(this.logger);
        this.securityManager = new SecurityManager(this.logger);
        // Initialize monitoring and quality control
        this.performanceMonitor = new PerformanceMonitor(this.logger);
        this.qualityController = new QualityController(this.logger);
        this.roleManager = new RoleManager(this.logger);
        // Initialize services with temporary instances
        this.anthropicService = new AnthropicService(this.logger, this.toolRegistry);
        this.learningSystem = new LearningSystem(this.logger, this.toolRegistry);
        this.promptManager = new PromptManager(this.logger, this.toolRegistry);
    }
    async initializeComponents() {
        if (this.initialized) {
            return;
        }
        try {
            // Initialize tool system
            const toolInitializer = ToolInitializer.getInstance(this.logger);
            this.toolRegistry = await toolInitializer.initialize(this.logger);
            // Initialize core components with updated registry
            this.learningSystem = new LearningSystem(this.logger, this.toolRegistry);
            this.promptManager = new PromptManager(this.logger, this.toolRegistry);
            this.anthropicService = new AnthropicService(this.logger, this.toolRegistry);
            // Initialize enhanced components
            this.performanceMonitor = new PerformanceMonitor(this.logger, {
                metricsDir: path.join(process.cwd(), 'logs', 'metrics'),
                alertConfig: {
                    responseTimeThreshold: 2000,
                    memoryThreshold: 0.8,
                    cpuThreshold: 0.7,
                    errorRateThreshold: 0.1,
                    checkInterval: 60000
                }
            });
            this.qualityController = new QualityController(this.logger, {
                minAccuracy: 0.8,
                minCompleteness: 0.9,
                minConsistency: 0.85,
                minRelevance: 0.8,
                minConfidence: 0.7
            });
            this.roleManager = new RoleManager(this.logger, {
                rolesDir: path.join(process.cwd(), 'config', 'roles'),
                adaptationThreshold: 0.7,
                maxAdaptations: 10
            });
            // Reinitialize tools with enhanced components
            await toolInitializer.reinitialize(this.logger, this.learningSystem, this.performanceMonitor, this.qualityController, this.roleManager);
            this.initialized = true;
            this.logger.info('Components initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize components:', error);
            throw error;
        }
    }
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        this.app.use(rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }));
        // Basic middleware
        this.app.use(json());
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(cookieParser());
        this.app.use(morgan('combined'));
        // Security checks
        this.app.use(this.securityManager.authenticate.bind(this.securityManager));
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                initialized: this.initialized
            });
        });
        // API routes
        this.app.post('/api/command', async (req, res) => {
            const startTime = Date.now();
            try {
                if (!this.initialized) {
                    throw new Error('System not fully initialized');
                }
                // Validate input with quality controller
                const inputValidation = await this.qualityController.validateResponse(req.body);
                if (!inputValidation.passed) {
                    throw new Error(`Input validation failed: ${inputValidation.issues.map(i => i.message).join(', ')}`);
                }
                // Select appropriate role for the command
                const roleContext = {
                    taskType: 'command',
                    complexity: 1,
                    requiredExpertise: ['command-processing'],
                    toolRequirements: ['anthropic-api']
                };
                const role = await this.roleManager.selectRole(roleContext);
                // Process command
                let result = await this.anthropicService.processCommand(req.body.command);
                // Validate output quality
                const outputValidation = await this.qualityController.validateResponse(result);
                if (!outputValidation.passed) {
                    result = await this.qualityController.improveResponse(result, outputValidation);
                }
                // Update performance metrics
                const duration = Date.now() - startTime;
                await this.performanceMonitor.updateMetrics({
                    responseTime: duration,
                    successRate: 1,
                    errorRate: 0
                });
                res.json(result);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                await this.performanceMonitor.updateMetrics({
                    responseTime: duration,
                    successRate: 0,
                    errorRate: 1
                });
                this.logger.error('Command processing error:', {
                    error: error.message,
                    command: req.body.command,
                    duration
                });
                res.status(500).json({
                    error: error.message,
                    type: error.name,
                    details: error.details || 'No additional details available'
                });
            }
        });
        // Tool routes
        this.app.post('/api/tool/:name', async (req, res) => {
            const startTime = Date.now();
            try {
                if (!this.initialized) {
                    throw new Error('System not fully initialized');
                }
                // Validate input with quality controller
                const inputValidation = await this.qualityController.validateResponse(req.body);
                if (!inputValidation.passed) {
                    throw new Error(`Input validation failed: ${inputValidation.issues.map(i => i.message).join(', ')}`);
                }
                // Select appropriate role for the tool
                const roleContext = {
                    taskType: 'tool-execution',
                    complexity: 1,
                    requiredExpertise: [req.params.name],
                    toolRequirements: [req.params.name]
                };
                const role = await this.roleManager.selectRole(roleContext);
                // Execute tool
                let result = await this.toolRegistry.executeTool(req.params.name, req.body);
                // Validate output quality
                const outputValidation = await this.qualityController.validateResponse(result);
                if (!outputValidation.passed) {
                    result = await this.qualityController.improveResponse(result, outputValidation);
                }
                // Update performance metrics
                const duration = Date.now() - startTime;
                await this.performanceMonitor.updateMetrics({
                    responseTime: duration,
                    successRate: 1,
                    errorRate: 0
                });
                res.json(result);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                await this.performanceMonitor.updateMetrics({
                    responseTime: duration,
                    successRate: 0,
                    errorRate: 1
                });
                this.logger.error('Tool execution error:', {
                    error: error.message,
                    tool: req.params.name,
                    params: req.body,
                    duration
                });
                res.status(500).json({
                    error: error.message,
                    type: error.name,
                    details: error.details || 'No additional details available'
                });
            }
        });
    }
    setupErrorHandling() {
        // Error handling middleware
        this.app.use((err, req, res, next) => {
            this.logger.error('Unhandled error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    async start() {
        try {
            // Initialize components
            await this.initializeComponents();
            // Setup middleware and routes
            this.setupMiddleware();
            this.setupRoutes();
            this.setupErrorHandling();
            // Start server
            const port = process.env.PORT || 3000;
            this.app.listen(port, () => {
                this.logger.info(`Server running on port ${port}`);
            });
        }
        catch (error) {
            this.logger.error('Failed to start system:', error);
            throw error;
        }
    }
    async stop() {
        try {
            if (this.initialized) {
                // Clean up core components
                await this.toolRegistry.cleanup();
                // Clean up monitoring and metrics
                await this.performanceMonitor.updateMetrics({
                    responseTime: 0,
                    successRate: 1,
                    errorRate: 0
                });
                // Log final system state
                const finalMetrics = await this.performanceMonitor.getMetricsAnalysis();
                this.logger.info('Final system metrics:', finalMetrics);
                // Reset state
                this.initialized = false;
            }
            this.logger.info('System stopped successfully');
        }
        catch (error) {
            this.logger.error('Error stopping system:', error);
            throw error;
        }
    }
}
export default ClaudeSystem;
//# sourceMappingURL=ClaudeSystem.js.map