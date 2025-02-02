import { ToolRegistry } from '../tools/Tool.js';
import { SystemControlTool } from '../tools/SystemControlTool.js';
import { FileTool } from '../tools/FileTool.js';
import { BrowserTool } from '../tools/BrowserTool.js';
export class ToolInitializer {
    constructor(logger) {
        this.toolRegistry = null;
        this.initialized = false;
        this.logger = logger;
    }
    static getInstance(logger) {
        if (!ToolInitializer.instance) {
            ToolInitializer.instance = new ToolInitializer(logger);
        }
        return ToolInitializer.instance;
    }
    async initialize(logger) {
        if (this.toolRegistry && this.initialized) {
            return this.toolRegistry;
        }
        try {
            this.logger.info('Initializing tool registry...');
            // Create new registry if not exists
            if (!this.toolRegistry) {
                this.toolRegistry = new ToolRegistry(logger);
            }
            else {
                // Clear existing registry
                this.toolRegistry.clear();
            }
            // Initialize and register tools
            await this.registerTools(logger);
            this.initialized = true;
            this.logger.info('Tool registry initialized successfully');
            return this.toolRegistry;
        }
        catch (error) {
            this.logger.error('Failed to initialize tool registry:', error);
            throw error;
        }
    }
    async reinitialize(logger, learningSystem, performanceMonitor, qualityController, roleManager) {
        try {
            this.logger.info('Reinitializing tool registry...');
            // Create new registry if not exists
            if (!this.toolRegistry) {
                this.toolRegistry = new ToolRegistry(logger);
            }
            else {
                // Clear existing registry
                this.toolRegistry.clear();
            }
            // Initialize and register tools with enhanced components
            await this.registerTools(logger, learningSystem, performanceMonitor, qualityController, roleManager);
            this.initialized = true;
            this.logger.info('Tool registry reinitialized successfully');
            return this.toolRegistry;
        }
        catch (error) {
            this.logger.error('Failed to reinitialize tool registry:', error);
            throw error;
        }
    }
    async registerTools(logger, learningSystem, performanceMonitor, qualityController, roleManager) {
        if (!this.toolRegistry) {
            throw new Error('Tool registry not initialized');
        }
        try {
            // System Control Tool
            const systemControlTool = new SystemControlTool(logger);
            this.toolRegistry.registerTool(systemControlTool);
            // File Tool
            const fileTool = new FileTool(logger);
            this.toolRegistry.registerTool(fileTool);
            // Browser Tool
            const browserTool = new BrowserTool(logger);
            this.toolRegistry.registerTool(browserTool);
            // Register additional tools based on environment configuration
            if (process.env.ENABLE_EXPERIMENTAL_TOOLS === 'true') {
                await this.registerExperimentalTools(logger);
            }
            // Wrap tools with enhanced functionality
            if (learningSystem || performanceMonitor || qualityController || roleManager) {
                await this.wrapToolsWithEnhancements(learningSystem, performanceMonitor, qualityController, roleManager);
            }
            this.logger.info('Tools registered successfully');
        }
        catch (error) {
            this.logger.error('Failed to register tools:', error);
            throw error;
        }
    }
    async registerExperimentalTools(logger) {
        // Register any experimental tools here
        this.logger.info('No experimental tools to register');
    }
    async wrapToolsWithEnhancements(learningSystem, performanceMonitor, qualityController, roleManager) {
        if (!this.toolRegistry) {
            throw new Error('Tool registry not initialized');
        }
        const tools = this.toolRegistry.getAllToolMetadata();
        tools.forEach(tool => {
            const originalTool = this.toolRegistry?.getTool(tool.name);
            if (!originalTool)
                return;
            const wrappedExecute = async (params) => {
                const startTime = Date.now();
                try {
                    // Role validation if role manager is available
                    if (roleManager) {
                        const context = {
                            taskType: tool.name,
                            complexity: 1,
                            requiredExpertise: [tool.name],
                            toolRequirements: [tool.name]
                        };
                        const role = await roleManager.selectRole(context);
                        if (!role.constraints.allowedTools.includes(tool.name) &&
                            !role.constraints.allowedTools.includes('all')) {
                            throw new Error(`Tool ${tool.name} not allowed for current role`);
                        }
                    }
                    // Quality control pre-execution if available
                    if (qualityController) {
                        const validationResult = await qualityController.validateResponse(params);
                        if (!validationResult.passed) {
                            throw new Error(`Input validation failed: ${validationResult.issues.map(i => i.message).join(', ')}`);
                        }
                    }
                    // Execute tool
                    let result = await originalTool.execute(params);
                    const duration = Date.now() - startTime;
                    // Performance monitoring if available
                    if (performanceMonitor) {
                        await performanceMonitor.updateMetrics({
                            responseTime: duration,
                            successRate: 1,
                            errorRate: 0
                        });
                    }
                    // Quality control post-execution if available
                    if (qualityController) {
                        const validationResult = await qualityController.validateResponse(result);
                        if (!validationResult.passed) {
                            result = await qualityController.improveResponse(result, validationResult);
                        }
                    }
                    // Learning system logging if available
                    if (learningSystem) {
                        await learningSystem.logInteraction({
                            command: `Tool execution: ${tool.name}`,
                            response: JSON.stringify(result),
                            tools_used: [tool.name],
                            success: true,
                            duration,
                            context: params.context,
                            confidence: 1
                        });
                        await learningSystem.updateToolEffectiveness(tool.name, true);
                    }
                    return result;
                }
                catch (error) {
                    const duration = Date.now() - startTime;
                    // Performance monitoring for errors
                    if (performanceMonitor) {
                        await performanceMonitor.updateMetrics({
                            responseTime: duration,
                            successRate: 0,
                            errorRate: 1
                        });
                    }
                    // Learning system error logging
                    if (learningSystem) {
                        await learningSystem.logInteraction({
                            command: `Tool execution: ${tool.name}`,
                            response: error.message,
                            tools_used: [tool.name],
                            success: false,
                            error: error.message,
                            duration,
                            context: params.context,
                            confidence: 0
                        });
                        await learningSystem.updateToolEffectiveness(tool.name, false);
                    }
                    throw error;
                }
            };
            // Replace original execute method with wrapped version
            originalTool.execute = wrappedExecute;
        });
        this.logger.info('Tools wrapped with enhanced functionality', {
            learning: !!learningSystem,
            performance: !!performanceMonitor,
            quality: !!qualityController,
            roles: !!roleManager
        });
    }
    async cleanup() {
        try {
            if (this.toolRegistry) {
                await this.toolRegistry.cleanup();
                this.toolRegistry = null;
            }
            this.initialized = false;
            this.logger.info('Tool registry cleaned up successfully');
        }
        catch (error) {
            this.logger.error('Failed to cleanup tool registry:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=ToolInitializer.js.map