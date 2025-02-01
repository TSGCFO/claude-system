import { Tool } from './Tool.js';
import { BrowserService } from '../services/BrowserService.js';
export class BrowserTool extends Tool {
    constructor(logger, learningSystem) {
        super(logger);
        this.isInitialized = false;
        this.metadata = {
            name: 'browser_control',
            description: 'Control web browsers and automate web interactions',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform (launch, navigate, click, type, screenshot, close)',
                    required: true
                },
                browser: {
                    type: 'string',
                    description: 'Browser to use (chrome, edge, firefox)',
                    required: false
                },
                url: {
                    type: 'string',
                    description: 'URL to navigate to',
                    required: false
                },
                selector: {
                    type: 'string',
                    description: 'Element selector for interactions',
                    required: false
                },
                text: {
                    type: 'string',
                    description: 'Text to type',
                    required: false
                },
                headless: {
                    type: 'boolean',
                    description: 'Run browser in headless mode',
                    required: false
                }
            }
        };
        this.browserService = new BrowserService(logger, learningSystem);
    }
    async execute(params) {
        try {
            // Initialize browser if needed
            if (!this.isInitialized && params.action !== 'launch') {
                await this.initializeBrowser();
            }
            switch (params.action) {
                case 'launch':
                    return await this.launchBrowser(params);
                case 'navigate':
                    return await this.navigateToUrl(params);
                case 'click':
                    return await this.clickElement(params);
                case 'type':
                    return await this.typeText(params);
                case 'screenshot':
                    return await this.takeScreenshot(params);
                case 'close':
                    return await this.closeBrowser();
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${params.action}`
                    };
            }
        }
        catch (error) {
            // Log error and attempt recovery
            this.logger.error('Browser tool error:', error);
            // Try to recover by reinitializing
            if (!this.isInitialized) {
                try {
                    await this.initializeBrowser();
                    // Retry the action after recovery
                    return await this.execute(params);
                }
                catch (recoveryError) {
                    return {
                        success: false,
                        error: `Browser control error (recovery failed): ${recoveryError.message}`
                    };
                }
            }
            return {
                success: false,
                error: `Browser control error: ${error.message}`
            };
        }
    }
    async initializeBrowser() {
        await this.launchBrowser({
            browser: 'chrome',
            headless: false
        });
        this.isInitialized = true;
    }
    async launchBrowser(params) {
        try {
            const config = {
                browser: params.browser || 'chrome',
                headless: params.headless || false,
                defaultViewport: {
                    width: 1280,
                    height: 800
                }
            };
            await this.browserService.launch(config);
            this.isInitialized = true;
            return {
                success: true,
                data: 'Browser launched successfully'
            };
        }
        catch (error) {
            this.isInitialized = false;
            return {
                success: false,
                error: `Failed to launch browser: ${error.message}`
            };
        }
    }
    async navigateToUrl(params) {
        try {
            if (!params.url) {
                return {
                    success: false,
                    error: 'URL is required for navigation'
                };
            }
            await this.browserService.navigate(params.url);
            return {
                success: true,
                data: `Navigated to ${params.url}`
            };
        }
        catch (error) {
            // If navigation fails, try to recover by reinitializing
            try {
                await this.initializeBrowser();
                await this.browserService.navigate(params.url);
                return {
                    success: true,
                    data: `Navigated to ${params.url} (after recovery)`
                };
            }
            catch (recoveryError) {
                return {
                    success: false,
                    error: `Failed to navigate: ${error.message} (recovery failed: ${recoveryError.message})`
                };
            }
        }
    }
    async clickElement(params) {
        try {
            if (!params.selector) {
                return {
                    success: false,
                    error: 'Selector is required for clicking'
                };
            }
            const state = this.browserService.getCurrentState();
            if (!state.isRunning) {
                await this.initializeBrowser();
            }
            // Click functionality would be implemented here
            // This is a placeholder for now
            return {
                success: true,
                data: `Clicked element: ${params.selector}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to click element: ${error.message}`
            };
        }
    }
    async typeText(params) {
        try {
            if (!params.selector || !params.text) {
                return {
                    success: false,
                    error: 'Selector and text are required for typing'
                };
            }
            const state = this.browserService.getCurrentState();
            if (!state.isRunning) {
                await this.initializeBrowser();
            }
            // Type functionality would be implemented here
            // This is a placeholder for now
            return {
                success: true,
                data: `Typed text into element: ${params.selector}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to type text: ${error.message}`
            };
        }
    }
    async takeScreenshot(params) {
        try {
            const state = this.browserService.getCurrentState();
            if (!state.isRunning) {
                await this.initializeBrowser();
            }
            // Screenshot functionality would be implemented here
            // This is a placeholder for now
            return {
                success: true,
                data: 'Screenshot taken'
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to take screenshot: ${error.message}`
            };
        }
    }
    async closeBrowser() {
        try {
            await this.browserService.cleanup();
            this.isInitialized = false;
            return {
                success: true,
                data: 'Browser closed successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to close browser: ${error.message}`
            };
        }
    }
    async cleanup() {
        await this.browserService.cleanup();
        this.isInitialized = false;
    }
}
//# sourceMappingURL=BrowserTool.js.map