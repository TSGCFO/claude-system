import * as puppeteer from 'puppeteer';
import { Logger } from 'winston';

export class BrowserService {
  private static instance: BrowserService;
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;
  private logger: Logger;

  private constructor(logger: Logger) {
    this.logger = logger;
  }

  static getInstance(logger: Logger): BrowserService {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService(logger);
    }
    return BrowserService.instance;
  }

  async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
      });
      this.logger.debug('Browser launched');
    }
    return this.browser;
  }

  async getPage(): Promise<puppeteer.Page> {
    if (!this.page) {
      const browser = await this.getBrowser();
      this.page = await browser.newPage();
      this.logger.debug('New page created');
    }
    return this.page;
  }

  async navigate(url: string): Promise<void> {
    const page = await this.getPage();
    await page.goto(url);
    this.logger.debug(`Navigated to ${url}`);
  }

  async cleanup(): Promise<void> {
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