import { Tool } from './Tool.js';
import puppeteer from 'puppeteer';
export class BrowserTool extends Tool {
    constructor(logger) {
        super(logger);
        this.browser = null;
        this.page = null;
        this.defaultViewport = {
            width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH || '1280', 10),
            height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT || '800', 10)
        };
    }
    get metadata() {
        return {
            name: 'browser_tool',
            description: 'Control web browser operations',
            parameters: {
                operation: {
                    type: 'string',
                    description: 'Operation to perform (launch, navigate, click, type, screenshot, close)',
                    required: true
                },
                url: {
                    type: 'string',
                    description: 'URL to navigate to',
                    required: false
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector for element interactions',
                    required: false
                },
                text: {
                    type: 'string',
                    description: 'Text to type',
                    required: false
                },
                coordinates: {
                    type: 'object',
                    description: 'Click coordinates {x, y}',
                    required: false
                },
                waitFor: {
                    type: 'string',
                    description: 'Wait for selector or timeout (ms)',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const { operation, url, selector, text, coordinates, waitFor } = params;
            switch (operation) {
                case 'launch':
                    return await this.launchBrowser(url);
                case 'navigate':
                    return await this.navigateTo(url);
                case 'click':
                    if (coordinates) {
                        return await this.clickCoordinates(coordinates);
                    }
                    else {
                        return await this.clickElement(selector);
                    }
                case 'type':
                    return await this.typeText(selector, text);
                case 'screenshot':
                    return await this.takeScreenshot();
                case 'close':
                    return await this.closeBrowser();
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        }
        catch (error) {
            this.logger.error('Browser operation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async launchBrowser(url) {
        try {
            if (this.browser) {
                await this.closeBrowser();
            }
            this.browser = await puppeteer.launch({
                headless: process.env.BROWSER_HEADLESS === 'true',
                defaultViewport: this.defaultViewport,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            if (url) {
                await this.page.goto(url, {
                    waitUntil: 'networkidle0',
                    timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10)
                });
            }
            return {
                success: true,
                data: 'Browser launched successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to launch browser: ${error.message}`);
        }
    }
    async navigateTo(url) {
        try {
            if (!url) {
                throw new Error('URL is required for navigate operation');
            }
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10)
            });
            return {
                success: true,
                data: `Navigated to ${url}`
            };
        }
        catch (error) {
            throw new Error(`Failed to navigate: ${error.message}`);
        }
    }
    async clickElement(selector) {
        try {
            if (!selector) {
                throw new Error('Selector is required for click operation');
            }
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            await this.page.waitForSelector(selector);
            await this.page.click(selector);
            return {
                success: true,
                data: `Clicked element: ${selector}`
            };
        }
        catch (error) {
            throw new Error(`Failed to click element: ${error.message}`);
        }
    }
    async clickCoordinates(coordinates) {
        try {
            if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
                throw new Error('Valid coordinates {x, y} are required');
            }
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            await this.page.mouse.click(coordinates.x, coordinates.y);
            return {
                success: true,
                data: `Clicked at coordinates: ${coordinates.x}, ${coordinates.y}`
            };
        }
        catch (error) {
            throw new Error(`Failed to click coordinates: ${error.message}`);
        }
    }
    async typeText(selector, text) {
        try {
            if (!selector) {
                throw new Error('Selector is required for type operation');
            }
            if (!text) {
                throw new Error('Text is required for type operation');
            }
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            await this.page.waitForSelector(selector);
            await this.page.type(selector, text);
            return {
                success: true,
                data: `Typed text into element: ${selector}`
            };
        }
        catch (error) {
            throw new Error(`Failed to type text: ${error.message}`);
        }
    }
    async takeScreenshot() {
        try {
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            const screenshot = await this.page.screenshot({
                encoding: 'base64'
            });
            return {
                success: true,
                data: {
                    type: 'image/png',
                    base64: screenshot
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to take screenshot: ${error.message}`);
        }
    }
    async closeBrowser() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
            }
            return {
                success: true,
                data: 'Browser closed successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to close browser: ${error.message}`);
        }
    }
    async cleanup() {
        await this.closeBrowser();
    }
}
//# sourceMappingURL=BrowserTool.js.map