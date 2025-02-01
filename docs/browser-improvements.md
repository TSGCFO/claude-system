# Browser Control Improvements

## Current Issues
1. Browser launch failures
2. Navigation not working
3. Lack of state verification
4. Poor error handling

## Required Enhancements

### 1. Browser Launch Process
```typescript
interface BrowserLaunchConfig {
  browser: 'chrome' | 'edge' | 'firefox';
  userProfile?: string;
  args?: string[];
  defaultViewport?: {
    width: number;
    height: number;
  };
  headless?: boolean;
}

async function launchBrowser(config: BrowserLaunchConfig): Promise<void> {
  // 1. Check if browser is already running
  // 2. Verify browser installation
  // 3. Launch with proper profile
  // 4. Verify launch success
  // 5. Handle errors gracefully
}
```

### 2. State Management
```typescript
interface BrowserState {
  isRunning: boolean;
  currentUrl?: string;
  activeTab?: number;
  totalTabs: number;
  windowState: 'maximized' | 'minimized' | 'normal';
  errors: Error[];
}

class BrowserStateManager {
  async getCurrentState(): Promise<BrowserState>;
  async verifyBrowserRunning(): Promise<boolean>;
  async ensureBrowserReady(): Promise<void>;
  async handleStateError(error: Error): Promise<void>;
}
```

### 3. Error Recovery
```typescript
interface BrowserError {
  type: 'launch' | 'navigation' | 'interaction' | 'state';
  message: string;
  browserState: BrowserState;
  recoveryAttempted: boolean;
}

class BrowserErrorHandler {
  async handleLaunchError(error: Error): Promise<void>;
  async recoverFromError(error: BrowserError): Promise<void>;
  async restartBrowser(): Promise<void>;
}
```

### 4. Browser Detection
```typescript
interface InstalledBrowser {
  name: string;
  path: string;
  version: string;
  isDefault: boolean;
}

class BrowserDetector {
  async getInstalledBrowsers(): Promise<InstalledBrowser[]>;
  async getDefaultBrowser(): Promise<InstalledBrowser>;
  async verifyBrowserPath(path: string): Promise<boolean>;
}
```

## Implementation Steps

1. Browser Service Updates
```typescript
class BrowserService {
  private stateManager: BrowserStateManager;
  private errorHandler: BrowserErrorHandler;
  private detector: BrowserDetector;

  async launch(config: BrowserLaunchConfig): Promise<void> {
    try {
      // 1. Detect available browsers
      const browsers = await this.detector.getInstalledBrowsers();
      
      // 2. Verify requested browser
      const browser = browsers.find(b => b.name === config.browser);
      if (!browser) {
        throw new Error(`Browser ${config.browser} not found`);
      }

      // 3. Check current state
      const state = await this.stateManager.getCurrentState();
      if (state.isRunning) {
        await this.errorHandler.restartBrowser();
      }

      // 4. Launch browser
      await this.launchBrowser(browser, config);

      // 5. Verify launch
      await this.stateManager.verifyBrowserRunning();

    } catch (error) {
      await this.errorHandler.handleLaunchError(error);
    }
  }

  async navigate(url: string): Promise<void> {
    try {
      // 1. Ensure browser is ready
      await this.stateManager.ensureBrowserReady();

      // 2. Navigate to URL
      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // 3. Verify navigation
      const currentUrl = await this.page.url();
      if (!currentUrl.includes(url)) {
        throw new Error('Navigation failed');
      }

    } catch (error) {
      await this.errorHandler.handleNavigationError(error);
    }
  }
}
```

2. Error Handling
```typescript
class EnhancedErrorHandler {
  async handleError(error: BrowserError): Promise<void> {
    // Log error for learning system
    await this.learningSystem.logError(error);

    // Attempt recovery
    if (!error.recoveryAttempted) {
      await this.recoverFromError(error);
    }

    // Update state
    await this.stateManager.updateState({
      error: error,
      lastRecoveryAttempt: new Date()
    });
  }
}
```

3. State Verification
```typescript
class StateVerifier {
  async verifyState(): Promise<void> {
    const state = await this.stateManager.getCurrentState();
    
    if (!state.isRunning) {
      await this.restartBrowser();
    }

    if (state.errors.length > 0) {
      await this.errorHandler.handleErrors(state.errors);
    }
  }
}
```

## Usage Example

```typescript
const browserService = new BrowserService();

// Launch browser
await browserService.launch({
  browser: 'chrome',
  userProfile: 'default',
  defaultViewport: { width: 1280, height: 800 }
});

// Navigate to URL
await browserService.navigate('https://app.extensiv.com');

// Verify state
await browserService.verifyState();
```

## Integration with Learning System

1. Log browser events
2. Track success/failure patterns
3. Identify common errors
4. Improve recovery strategies
5. Optimize launch configurations

## Next Steps

1. Implement BrowserService enhancements
2. Add robust error handling
3. Improve state management
4. Add automatic recovery
5. Integrate with learning system
6. Add detailed logging
7. Implement verification steps
8. Test edge cases