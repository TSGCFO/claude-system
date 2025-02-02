import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
export declare class FileTool extends Tool {
    constructor(logger: Logger);
    get metadata(): ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private readFile;
    private writeFile;
    private deleteFile;
    private listFiles;
    private readDirectory;
    private searchFiles;
    cleanup(): Promise<void>;
}
