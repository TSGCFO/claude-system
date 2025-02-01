import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
import { BrowserTool } from '../tools/BrowserTool.js';
import { SystemControlTool } from '../tools/SystemControlTool.js';
import { ReadFileTool, WriteFileTool, ListFilesTool, DeleteFileTool, SearchFileContentTool } from '../tools/FileTool.js';
import { ExecuteCommandTool, LaunchApplicationTool, GetSystemInfoTool, ProcessControlTool } from '../tools/SystemTool.js';
import { LearningSystem } from './LearningSystem.js';

export class ToolInitializer {
  private static instance: ToolInitializer;
  private toolRegistry: ToolRegistry;
  private initialized: boolean = false;
  private logger: Logger;
  private browserTool?: BrowserTool;

  private constructor(logger: Logger) {
    this.logger = logger;
    this.toolRegistry = new ToolRegistry(logger);
  }

  public static getInstance(logger: Logger): ToolInitializer {
    if (!ToolInitializer.instance) {
      ToolInitializer.instance = new ToolInitializer(logger);
    }
    return ToolInitializer.instance;
  }

  private createBaseTools(logger: Logger): any[] {
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

  public async initialize(logger: Logger, learningSystem?: LearningSystem): Promise<ToolRegistry> {
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

  public getToolRegistry(): ToolRegistry {
    if (!this.initialized) {
      throw new Error('ToolInitializer must be initialized before getting ToolRegistry');
    }
    return this.toolRegistry;
  }

  public async cleanup(): Promise<void> {
    if (this.initialized) {
      await this.toolRegistry.cleanup();
      this.browserTool = undefined;
      this.initialized = false;
    }
  }

  public async reinitialize(logger: Logger, learningSystem: LearningSystem): Promise<ToolRegistry> {
    // Clean up existing tools
    await this.cleanup();
    
    // Initialize with base tools and browser tool
    return this.initialize(logger, learningSystem);
  }

  public reset(): void {
    this.toolRegistry.clear();
    this.browserTool = undefined;
    this.initialized = false;
  }
}