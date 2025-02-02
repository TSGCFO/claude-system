import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
export declare class BrowserTool extends Tool {
    private browser;
    private page;
    private readonly defaultViewport;
    constructor(logger: Logger);
    get metadata(): ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private launchBrowser;
    private navigateTo;
    private clickElement;
    private clickCoordinates;
    private typeText;
    private takeScreenshot;
    private closeBrowser;
    cleanup(): Promise<void>;
}
