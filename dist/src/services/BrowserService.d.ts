import { Logger } from 'winston';
import { LearningSystem } from './LearningSystem.js';
export declare class BrowserService {
    private browser;
    private page;
    private logger;
    private learningSystem;
    private readonly defaultViewport;
    constructor(logger: Logger, learningSystem: LearningSystem);
    launch(url?: string): Promise<void>;
    navigate(url: string): Promise<void>;
    click(selector: string): Promise<void>;
    type(selector: string, text: string): Promise<void>;
    screenshot(): Promise<string>;
    close(): Promise<void>;
}
