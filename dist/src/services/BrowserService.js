import puppeteer from 'puppeteer';
export class BrowserService {
    constructor(logger, learningSystem) {
        this.browser = null;
        this.page = null;
        this.defaultViewport = {
            width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH || '1280', 10),
            height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT || '800', 10)
        };
        this.logger = logger;
        this.learningSystem = learningSystem;
    }
    async launch(url) {
        try {
            if (this.browser) {
                await this.close();
            }
            const startTime = Date.now();
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
            const duration = Date.now() - startTime;
            await this.learningSystem.logInteraction({
                command: `Launch browser${url ? ` and navigate to ${url}` : ''}`,
                response: 'Browser launched successfully',
                tools_used: ['browser_launch'],
                success: true,
                duration
            });
        }
        catch (error) {
            const errorMessage = `Failed to launch browser: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: `Launch browser${url ? ` and navigate to ${url}` : ''}`,
                response: errorMessage,
                tools_used: ['browser_launch'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
    async navigate(url) {
        try {
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            const startTime = Date.now();
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10)
            });
            const duration = Date.now() - startTime;
            await this.learningSystem.logInteraction({
                command: `Navigate to ${url}`,
                response: 'Navigation successful',
                tools_used: ['browser_navigate'],
                success: true,
                duration
            });
        }
        catch (error) {
            const errorMessage = `Failed to navigate: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: `Navigate to ${url}`,
                response: errorMessage,
                tools_used: ['browser_navigate'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
    async click(selector) {
        try {
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            const startTime = Date.now();
            await this.page.waitForSelector(selector);
            await this.page.click(selector);
            const duration = Date.now() - startTime;
            await this.learningSystem.logInteraction({
                command: `Click element: ${selector}`,
                response: 'Click successful',
                tools_used: ['browser_click'],
                success: true,
                duration
            });
        }
        catch (error) {
            const errorMessage = `Failed to click element: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: `Click element: ${selector}`,
                response: errorMessage,
                tools_used: ['browser_click'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
    async type(selector, text) {
        try {
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            const startTime = Date.now();
            await this.page.waitForSelector(selector);
            await this.page.type(selector, text);
            const duration = Date.now() - startTime;
            await this.learningSystem.logInteraction({
                command: `Type text into element: ${selector}`,
                response: 'Text input successful',
                tools_used: ['browser_type'],
                success: true,
                duration
            });
        }
        catch (error) {
            const errorMessage = `Failed to type text: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: `Type text into element: ${selector}`,
                response: errorMessage,
                tools_used: ['browser_type'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
    async screenshot() {
        try {
            if (!this.page) {
                throw new Error('Browser not initialized');
            }
            const startTime = Date.now();
            const screenshot = await this.page.screenshot({
                encoding: 'base64'
            });
            const duration = Date.now() - startTime;
            await this.learningSystem.logInteraction({
                command: 'Take screenshot',
                response: 'Screenshot captured successfully',
                tools_used: ['browser_screenshot'],
                success: true,
                duration
            });
            return screenshot;
        }
        catch (error) {
            const errorMessage = `Failed to take screenshot: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: 'Take screenshot',
                response: errorMessage,
                tools_used: ['browser_screenshot'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
    async close() {
        try {
            if (this.browser) {
                const startTime = Date.now();
                await this.browser.close();
                this.browser = null;
                this.page = null;
                const duration = Date.now() - startTime;
                await this.learningSystem.logInteraction({
                    command: 'Close browser',
                    response: 'Browser closed successfully',
                    tools_used: ['browser_close'],
                    success: true,
                    duration
                });
            }
        }
        catch (error) {
            const errorMessage = `Failed to close browser: ${error.message}`;
            await this.learningSystem.logInteraction({
                command: 'Close browser',
                response: errorMessage,
                tools_used: ['browser_close'],
                success: false,
                error: errorMessage,
                duration: 0
            });
            throw error;
        }
    }
}
//# sourceMappingURL=BrowserService.js.map