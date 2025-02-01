import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as os from 'os';
export class BrowserService {
    constructor(logger, learningSystem) {
        this.isCleaningUp = false;
        this.logger = logger;
        this.learningSystem = learningSystem;
        this.state = {
            isRunning: false,
            totalTabs: 0,
            windowState: 'normal',
            errors: []
        };
    }
    async detectBrowsers() {
        const browsers = [];
        const platform = os.platform();
        try {
            if (platform === 'win32') {
                // Check for Chrome
                const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
                if (await this.fileExists(chromePath)) {
                    browsers.push({
                        name: 'chrome',
                        path: chromePath,
                        version: await this.getBrowserVersion(chromePath),
                        isDefault: false
                    });
                }
                // Check for Edge
                const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
                if (await this.fileExists(edgePath)) {
                    browsers.push({
                        name: 'edge',
                        path: edgePath,
                        version: await this.getBrowserVersion(edgePath),
                        isDefault: false
                    });
                }
                // Check for Firefox
                const firefoxPath = 'C:\\Program Files\\Mozilla Firefox\\firefox.exe';
                if (await this.fileExists(firefoxPath)) {
                    browsers.push({
                        name: 'firefox',
                        path: firefoxPath,
                        version: await this.getBrowserVersion(firefoxPath),
                        isDefault: false
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Error detecting browsers', error);
        }
        return browsers;
    }
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async getBrowserVersion(browserPath) {
        try {
            return '1.0.0'; // Simplified version
        }
        catch (error) {
            return 'unknown';
        }
    }
    async launch(config) {
        try {
            // Check if browser is already running
            if (this.state.isRunning) {
                await this.cleanup();
            }
            // Detect available browsers
            const browsers = await this.detectBrowsers();
            const browser = browsers.find(b => b.name === config.browser);
            if (!browser) {
                throw new Error(`Browser ${config.browser} not found`);
            }
            // Configure launch options
            const launchOptions = {
                executablePath: browser.path,
                defaultViewport: config.defaultViewport ?? { width: 1280, height: 800 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    ...(config.args || [])
                ]
            };
            // Set headless mode if specified
            if (config.headless !== undefined) {
                launchOptions.headless = config.headless ? 'new' : false;
            }
            // Launch browser with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    this.browser = await puppeteer.launch(launchOptions);
                    break;
                }
                catch (error) {
                    retries--;
                    if (retries === 0)
                        throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            // Create new page with retry logic
            retries = 3;
            while (retries > 0) {
                try {
                    const pages = await this.browser.pages();
                    this.page = pages[0] || await this.browser.newPage();
                    break;
                }
                catch (error) {
                    retries--;
                    if (retries === 0)
                        throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            // Update state
            this.state = {
                isRunning: true,
                totalTabs: 1,
                windowState: 'normal',
                errors: []
            };
            this.logger.info('Browser launched successfully', {
                browser: config.browser,
                state: this.state
            });
        }
        catch (error) {
            const browserError = {
                type: 'launch',
                message: error.message,
                browserState: this.state,
                recoveryAttempted: false
            };
            await this.handleError(browserError);
            throw error;
        }
    }
    async navigate(url) {
        try {
            await this.ensureBrowserReady();
            // Navigate to URL with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    if (!this.page)
                        throw new Error('Page not initialized');
                    await this.page.goto(url, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });
                    break;
                }
                catch (error) {
                    retries--;
                    if (retries === 0)
                        throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            // Update state
            this.state.currentUrl = url;
            this.logger.info('Navigation successful', {
                url,
                state: this.state
            });
        }
        catch (error) {
            const browserError = {
                type: 'navigation',
                message: error.message,
                browserState: this.state,
                recoveryAttempted: false
            };
            await this.handleError(browserError);
            throw error;
        }
    }
    async ensureBrowserReady() {
        if (!this.state.isRunning || !this.browser || !this.page) {
            await this.launch({
                browser: 'chrome',
                headless: false
            });
        }
    }
    async handleError(error) {
        this.logger.error('Browser error occurred', error);
        // Log error for learning system
        await this.learningSystem.logInteraction({
            user_input: 'browser_operation',
            system_prompt: '',
            claude_response: '',
            tools_used: [],
            success: false,
            error: {
                type: error.type,
                message: error.message
            },
            context: {
                system_state: {},
                memory_state: {},
                tool_state: {
                    browser: this.state
                }
            }
        });
        // Attempt recovery if not already tried
        if (!error.recoveryAttempted && !this.isCleaningUp) {
            try {
                await this.cleanup();
                await this.launch({
                    browser: 'chrome',
                    headless: false
                });
                error.recoveryAttempted = true;
            }
            catch (recoveryError) {
                this.logger.error('Recovery attempt failed', recoveryError);
            }
        }
        // Update state
        this.state.errors.push(new Error(error.message));
    }
    async cleanup() {
        if (this.isCleaningUp)
            return;
        this.isCleaningUp = true;
        try {
            if (this.page) {
                try {
                    await this.page.close();
                }
                catch (error) {
                    this.logger.debug('Error closing page', error);
                }
                this.page = undefined;
            }
            if (this.browser) {
                try {
                    await this.browser.close();
                }
                catch (error) {
                    this.logger.debug('Error closing browser', error);
                }
                this.browser = undefined;
            }
            this.state = {
                isRunning: false,
                totalTabs: 0,
                windowState: 'normal',
                errors: []
            };
        }
        catch (error) {
            this.logger.error('Error during cleanup', error);
        }
        finally {
            this.isCleaningUp = false;
        }
    }
    getCurrentState() {
        return { ...this.state };
    }
}
//# sourceMappingURL=BrowserService.js.map