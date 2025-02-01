import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
export declare class ExecuteCommandTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class LaunchApplicationTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class GetSystemInfoTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class ProcessControlTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private listProcesses;
    private killProcess;
}
