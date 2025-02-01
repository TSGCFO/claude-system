import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
import { LearningSystem } from '../services/LearningSystem.js';
export declare class BrowserTool extends Tool {
    private browserService;
    private isInitialized;
    constructor(logger: Logger, learningSystem: LearningSystem);
    readonly metadata: ToolMetadata;
    execute(params: ToolParams): Promise<ToolResult>;
    private initializeBrowser;
    private launchBrowser;
    private navigateToUrl;
    private clickElement;
    private typeText;
    private takeScreenshot;
    private closeBrowser;
    cleanup(): Promise<void>;
}
