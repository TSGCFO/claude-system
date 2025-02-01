import { Logger } from 'winston';

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
}

export interface ToolParams {
  [key: string]: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class Tool {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  abstract get metadata(): ToolMetadata;
  abstract execute(params: ToolParams): Promise<ToolResult>;

  // Optional cleanup method that tools can implement
  async cleanup?(): Promise<void>;
}

export class ToolRegistry {
  private tools: Map<string, Tool>;
  private logger: Logger;
  private registeredTools: Set<string>;

  constructor(logger: Logger) {
    this.tools = new Map();
    this.registeredTools = new Set();
    this.logger = logger;
  }

  registerTool(tool: Tool): void {
    const name = tool.metadata.name;
    if (this.registeredTools.has(name)) {
      this.logger.warn(`Tool ${name} is already registered. Skipping registration.`);
      return;
    }
    this.logger.debug(`Registering tool: ${name}`);
    this.tools.set(name, tool);
    this.registeredTools.add(name);
  }

  async executeTool(toolName: string, params: ToolParams): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      this.logger.error(`Tool not found: ${toolName}`);
      return {
        success: false,
        error: `Tool not found: ${toolName}`
      };
    }

    try {
      this.logger.debug(`Executing tool: ${toolName}`, { params });
      const result = await tool.execute(params);
      this.logger.debug(`Tool execution result:`, { toolName, result });
      return result;
    } catch (error: any) {
      this.logger.error(`Tool execution error: ${toolName}`, error);
      return {
        success: false,
        error: `Tool execution error: ${error.message}`
      };
    }
  }

  getAllToolMetadata(): ToolMetadata[] {
    return Array.from(this.tools.values()).map(tool => tool.metadata);
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  hasToolWithName(name: string): boolean {
    return this.tools.has(name);
  }

  validateToolParams(toolName: string, params: ToolParams): string[] {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return [`Tool not found: ${toolName}`];
    }

    const errors: string[] = [];
    const metadata = tool.metadata;

    // Check required parameters
    Object.entries(metadata.parameters)
      .filter(([_, param]) => param.required)
      .forEach(([name, _]) => {
        if (!(name in params)) {
          errors.push(`Missing required parameter: ${name}`);
        }
      });

    // Check parameter types (basic validation)
    Object.entries(params).forEach(([name, value]) => {
      const paramMetadata = metadata.parameters[name];
      if (!paramMetadata) {
        errors.push(`Unknown parameter: ${name}`);
        return;
      }

      // Basic type checking
      switch (paramMetadata.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Parameter ${name} must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Parameter ${name} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter ${name} must be a boolean`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || value === null) {
            errors.push(`Parameter ${name} must be an object`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Parameter ${name} must be an array`);
          }
          break;
      }
    });

    return errors;
  }

  async cleanup(): Promise<void> {
    // Clean up all tools
    for (const [name, tool] of this.tools.entries()) {
      if (typeof tool.cleanup === 'function') {
        try {
          await tool.cleanup();
          this.logger.debug(`Cleaned up tool: ${name}`);
        } catch (error) {
          this.logger.error(`Error cleaning up tool ${name}:`, error);
        }
      }
    }
    this.clear();
  }

  clear(): void {
    this.tools.clear();
    this.registeredTools.clear();
  }
}