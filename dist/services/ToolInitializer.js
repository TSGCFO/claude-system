import { ToolRegistry } from '../tools/Tool.js';
import { BrowserTool } from '../tools/BrowserTool.js';
import { SystemControlTool } from '../tools/SystemControlTool.js';
import { ReadFileTool, WriteFileTool, ListFilesTool, DeleteFileTool, SearchFileContentTool } from '../tools/FileTool.js';
import { ExecuteCommandTool, LaunchApplicationTool, GetSystemInfoTool, ProcessControlTool } from '../tools/SystemTool.js';
export class ToolInitializer {
    constructor(logger) {
        this.initialized = false;
        this.logger = logger;
        this.toolRegistry = new ToolRegistry(logger);
    }
    static getInstance(logger) {
        if (!ToolInitializer.instance) {
            ToolInitializer.instance = new ToolInitializer(logger);
        }
        return ToolInitializer.instance;
    }
    createBaseTools(logger) {
        return [
            // System control tool
            new SystemControlTool(logger),
            // File tools
            new ReadFileTool(logger),
            new WriteFileTool(logger),
            new ListFilesTool(logger),
            new DeleteFileTool(logger),
            new SearchFileContentTool(logger),
            // System tools
            new ExecuteCommandTool(logger),
            new LaunchApplicationTool(logger),
            new GetSystemInfoTool(logger),
            new ProcessControlTool(logger)
        ];
    }
    async initialize(logger, learningSystem) {
        if (!this.initialized) {
            // Register base tools
            const baseTools = this.createBaseTools(logger);
            baseTools.forEach(tool => {
                this.toolRegistry.registerTool(tool);
            });
            this.initialized = true;
        }
        // Add browser tool if learning system is provided and not already added
        if (learningSystem && !this.browserTool) {
            this.browserTool = new BrowserTool(logger, learningSystem);
            this.toolRegistry.registerTool(this.browserTool);
        }
        return this.toolRegistry;
    }
    getToolRegistry() {
        if (!this.initialized) {
            throw new Error('ToolInitializer must be initialized before getting ToolRegistry');
        }
        return this.toolRegistry;
    }
    async cleanup() {
        if (this.initialized) {
            await this.toolRegistry.cleanup();
            this.browserTool = undefined;
            this.initialized = false;
        }
    }
    async reinitialize(logger, learningSystem) {
        // Clean up existing tools
        await this.cleanup();
        // Initialize with base tools and browser tool
        return this.initialize(logger, learningSystem);
    }
    reset() {
        this.toolRegistry.clear();
        this.browserTool = undefined;
        this.initialized = false;
    }
}
//# sourceMappingURL=ToolInitializer.js.map