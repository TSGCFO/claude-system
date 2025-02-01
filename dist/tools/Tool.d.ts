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
export declare abstract class Tool {
    protected logger: Logger;
    constructor(logger: Logger);
    abstract get metadata(): ToolMetadata;
    abstract execute(params: ToolParams): Promise<ToolResult>;
    cleanup?(): Promise<void>;
}
export declare class ToolRegistry {
    private tools;
    private logger;
    private registeredTools;
    constructor(logger: Logger);
    registerTool(tool: Tool): void;
    executeTool(toolName: string, params: ToolParams): Promise<ToolResult>;
    getAllToolMetadata(): ToolMetadata[];
    getToolNames(): string[];
    getTool(name: string): Tool | undefined;
    hasToolWithName(name: string): boolean;
    validateToolParams(toolName: string, params: ToolParams): string[];
    cleanup(): Promise<void>;
    clear(): void;
}
