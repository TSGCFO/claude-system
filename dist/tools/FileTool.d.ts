import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
export declare class ReadFileTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class WriteFileTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class ListFilesTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private listFiles;
}
export declare class DeleteFileTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
}
export declare class SearchFileContentTool extends Tool {
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private searchFiles;
}
