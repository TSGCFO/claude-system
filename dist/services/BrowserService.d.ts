import { Logger } from 'winston';
import { LearningSystem } from './LearningSystem.js';
export interface BrowserLaunchConfig {
    browser: 'chrome' | 'edge' | 'firefox';
    userProfile?: string;
    args?: string[];
    defaultViewport?: {
        width: number;
        height: number;
    };
    headless?: boolean;
}
export interface BrowserState {
    isRunning: boolean;
    currentUrl?: string;
    activeTab?: number;
    totalTabs: number;
    windowState: 'maximized' | 'minimized' | 'normal';
    errors: Error[];
}
export interface BrowserError {
    type: 'launch' | 'navigation' | 'interaction' | 'state';
    message: string;
    browserState: BrowserState;
    recoveryAttempted: boolean;
}
export interface InstalledBrowser {
    name: string;
    path: string;
    version: string;
    isDefault: boolean;
}
export declare class BrowserService {
    private browser?;
    private page?;
    private state;
    private logger;
    private learningSystem;
    private isCleaningUp;
    constructor(logger: Logger, learningSystem: LearningSystem);
    private detectBrowsers;
    private fileExists;
    private getBrowserVersion;
    launch(config: BrowserLaunchConfig): Promise<void>;
    navigate(url: string): Promise<void>;
    private ensureBrowserReady;
    private handleError;
    cleanup(): Promise<void>;
    getCurrentState(): BrowserState;
}
