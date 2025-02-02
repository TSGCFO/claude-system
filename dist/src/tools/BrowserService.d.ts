import * as puppeteer from 'puppeteer';
import { Logger } from 'winston';
export declare class BrowserService {
    private static instance;
    private browser;
    private page;
    private logger;
    private constructor();
    static getInstance(logger: Logger): BrowserService;
    getBrowser(): Promise<puppeteer.Browser>;
    getPage(): Promise<puppeteer.Page>;
    navigate(url: string): Promise<void>;
    cleanup(): Promise<void>;
}
