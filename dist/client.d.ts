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
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}
export declare class ComputerControlClient {
    private baseUrl;
    private logger;
    constructor(baseUrl?: string);
    /**
     * Get list of available tools
     */
    getTools(): Promise<ToolMetadata[]>;
    /**
     * Execute a tool with given parameters
     */
    executeTool(name: string, params: Record<string, any>): Promise<ToolResult>;
    /**
     * Read a file
     */
    readFile(path: string): Promise<string>;
    /**
     * Write to a file
     */
    writeFile(path: string, content: string): Promise<void>;
    /**
     * Navigate to a website
     */
    navigateWeb(url: string): Promise<void>;
    /**
     * Click an element on the webpage
     */
    clickElement(selector?: string, coordinates?: {
        x: number;
        y: number;
    }, text?: string): Promise<void>;
    /**
     * Execute a system command
     */
    executeCommand(command: string, cwd?: string): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Launch an application
     */
    launchApplication(name: string, args?: string[]): Promise<void>;
    /**
     * Get system information
     */
    getSystemInfo(type?: 'cpu' | 'memory' | 'os'): Promise<Record<string, any>>;
}
declare const _default: ComputerControlClient;
export default _default;
