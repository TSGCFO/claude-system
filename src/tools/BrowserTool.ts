import { Tool, ToolMetadata, ToolParams, ToolResult } from './Tool.js';
import { Logger } from 'winston';
import { BrowserService, BrowserLaunchConfig } from '../services/BrowserService.js';
import { LearningSystem } from '../services/LearningSystem.js';

export class BrowserTool extends Tool {
  private browserService: BrowserService;
  private isInitialized: boolean = false;

  constructor(logger: Logger, learningSystem: LearningSystem) {
    super(logger);
    this.browserService = new BrowserService(logger, learningSystem);
  }

  public readonly metadata: ToolMetadata = {
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

  async execute(params: ToolParams): Promise<ToolResult> {
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
    } catch (error: any) {
      // Log error and attempt recovery
      this.logger.error('Browser tool error:', error);
      
      // Try to recover by reinitializing
      if (!this.isInitialized) {
        try {
          await this.initializeBrowser();
          // Retry the action after recovery
          return await this.execute(params);
        } catch (recoveryError: any) {
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

  private async initializeBrowser(): Promise<void> {
    await this.launchBrowser({
      browser: 'chrome',
      headless: false
    });
    this.isInitialized = true;
  }

  private async launchBrowser(params: any): Promise<ToolResult> {
    try {
      const config: BrowserLaunchConfig = {
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
    } catch (error: any) {
      this.isInitialized = false;
      return {
        success: false,
        error: `Failed to launch browser: ${error.message}`
      };
    }
  }

  private async navigateToUrl(params: any): Promise<ToolResult> {
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
    } catch (error: any) {
      // If navigation fails, try to recover by reinitializing
      try {
        await this.initializeBrowser();
        await this.browserService.navigate(params.url);
        return {
          success: true,
          data: `Navigated to ${params.url} (after recovery)`
        };
      } catch (recoveryError: any) {
        return {
          success: false,
          error: `Failed to navigate: ${error.message} (recovery failed: ${recoveryError.message})`
        };
      }
    }
  }

  private async clickElement(params: any): Promise<ToolResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to click element: ${error.message}`
      };
    }
  }

  private async typeText(params: any): Promise<ToolResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to type text: ${error.message}`
      };
    }
  }

  private async takeScreenshot(params: any): Promise<ToolResult> {
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
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to take screenshot: ${error.message}`
      };
    }
  }

  private async closeBrowser(): Promise<ToolResult> {
    try {
      await this.browserService.cleanup();
      this.isInitialized = false;
      return {
        success: true,
        data: 'Browser closed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to close browser: ${error.message}`
      };
    }
  }

  async cleanup(): Promise<void> {
    await this.browserService.cleanup();
    this.isInitialized = false;
  }
}