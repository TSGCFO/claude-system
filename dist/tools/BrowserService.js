import * as puppeteer from 'puppeteer';
export class BrowserService {
    constructor(logger) {
        this.browser = null;
        this.page = null;
        this.logger = logger;
    }
    static getInstance(logger) {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService(logger);
        }
        return BrowserService.instance;
    }
    async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1280, height: 800 }
            });
            this.logger.debug('Browser launched');
        }
        return this.browser;
    }
    async getPage() {
        if (!this.page) {
            const browser = await this.getBrowser();
            this.page = await browser.newPage();
            this.logger.debug('New page created');
        }
        return this.page;
    }
    async navigate(url) {
        const page = await this.getPage();
        await page.goto(url);
        this.logger.debug(`Navigated to ${url}`);
    }
    async cleanup() {
        if (this.page) {
            await this.page.close();
            this.page = null;
            this.logger.debug('Page closed');
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.logger.debug('Browser closed');
        }
    }
}
//# sourceMappingURL=BrowserService.js.map