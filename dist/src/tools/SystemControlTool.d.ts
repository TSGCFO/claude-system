import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
export declare class SystemControlTool extends Tool {
    private processes;
    constructor(logger: Logger);
    get metadata(): ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private executeCommand;
    private validateCommand;
    private killProcess;
    private getProcessStatus;
    private getSystemInfo;
    cleanup(): Promise<void>;
}
