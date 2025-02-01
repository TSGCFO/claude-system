import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
export declare class SystemControlTool extends Tool {
    constructor(logger: Logger);
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private typeText;
    private pressKeys;
    private mouseClick;
    private mouseMove;
    private getMousePosition;
}
