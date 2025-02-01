import { Operation, OperationType, SystemState, ValidationResult, OperationError } from '../types/core.js';
import { SecurityManager } from '../security/SecurityManager.js';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import * as puppeteer from 'puppeteer';
import * as os from 'node:os';
import { createLogger, format, transports } from 'winston';
import { dirname } from 'node:path';

const execAsync = promisify(exec);

export class OperationExecutor {
  private securityManager: SecurityManager;
  private browser: puppeteer.Browser | null = null;
  private operationQueue: Operation[] = [];
  private activeOperations: Map<string, Operation> = new Map();
  private logger: any;

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
    this.logger = createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/executor.log' })
      ]
    });
  }

  /**
   * Execute an operation
   */
  async executeOperation(operation: Operation): Promise<void> {
    try {
      this.logger.info('Starting operation execution', { operationId: operation.id, type: operation.type });

      // Update operation status
      operation.status = 'VALIDATING';
      operation.startedAt = new Date();

      // Validate operation
      const validationResult = await this.validateOperation(operation);
      if (!validationResult.valid) {
        const error = new Error(`Operation validation failed: ${validationResult.errors?.[0]?.message}`);
        this.logger.error('Validation failed', { 
          operationId: operation.id,
          errors: validationResult.errors
        });
        throw error;
      }

      // Add to active operations
      this.activeOperations.set(operation.id, operation);
      operation.status = 'EXECUTING';

      this.logger.debug('Executing operation', { 
        operationId: operation.id,
        type: operation.type,
        params: operation.params
      });

      // Execute based on operation type
      switch (operation.type) {
        case 'FILE_OPERATION':
          await this.executeFileOperation(operation);
          break;
        case 'WEB_NAVIGATION':
          await this.executeWebNavigation(operation);
          break;
        case 'APP_CONTROL':
          await this.executeAppControl(operation);
          break;
        case 'SYSTEM_SETTINGS':
          await this.executeSystemSettings(operation);
          break;
        case 'COMMAND_EXECUTION':
          await this.executeCommand(operation);
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      // Update operation status
      operation.status = 'COMPLETED';
      operation.completedAt = new Date();
      this.logger.info('Operation completed successfully', { operationId: operation.id });

    } catch (error) {
      // Handle operation failure
      this.logger.error('Operation failed', {
        operationId: operation.id,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });

      operation.status = 'FAILED';
      operation.error = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      };

      // Attempt rollback if needed
      await this.rollbackOperation(operation).catch(rollbackError => {
        this.logger.error('Rollback failed', {
          operationId: operation.id,
          error: rollbackError
        });
      });

      throw error;
    } finally {
      // Cleanup
      this.activeOperations.delete(operation.id);
    }
  }

  /**
   * Execute file system operations
   */
  private async executeFileOperation(operation: Operation): Promise<void> {
    const { action, path, content } = operation.params as any;
    this.logger.debug('Executing file operation', { action, path });

    try {
      // Ensure directory exists
      if (action === 'WRITE') {
        await fs.mkdir(dirname(path), { recursive: true });
      }

      switch (action) {
        case 'READ':
          const data = await fs.readFile(path, 'utf-8');
          operation.context.result = { content: data };
          break;
        case 'WRITE':
          await fs.writeFile(path, content || '', 'utf-8');
          break;
        case 'DELETE':
          await fs.unlink(path);
          break;
        default:
          throw new Error(`Unsupported file operation: ${action}`);
      }
    } catch (error) {
      this.logger.error('File operation failed', {
        action,
        path,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Execute web navigation operations
   */
  private async executeWebNavigation(operation: Operation): Promise<void> {
    const { action, url, selector, coordinates } = operation.params as any;
    this.logger.debug('Executing web navigation', { action, url });

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
      });
    }

    const page = await this.browser.newPage();

    try {
      switch (action) {
        case 'NAVIGATE':
          await page.goto(url);
          break;
        case 'CLICK':
          if (coordinates) {
            await page.mouse.click(coordinates.x, coordinates.y);
          } else if (selector) {
            await page.click(selector);
          }
          break;
        default:
          throw new Error(`Unsupported web navigation action: ${action}`);
      }
    } catch (error) {
      this.logger.error('Web navigation failed', {
        action,
        url,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Execute application control operations
   */
  private async executeAppControl(operation: Operation): Promise<void> {
    const { action, appName } = operation.params as any;
    this.logger.debug('Executing app control', { action, appName });

    try {
      switch (action) {
        case 'LAUNCH':
          await execAsync(`start ${appName}`);
          break;
        case 'CLOSE':
          await execAsync(`taskkill /IM "${appName}" /F`);
          break;
        default:
          throw new Error(`Unsupported app control action: ${action}`);
      }
    } catch (error) {
      this.logger.error('App control failed', {
        action,
        appName,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Execute system settings operations
   */
  private async executeSystemSettings(operation: Operation): Promise<void> {
    const { action, setting } = operation.params as any;
    this.logger.debug('Executing system settings operation', { action, setting });

    try {
      switch (action) {
        case 'GET':
          switch (setting) {
            case 'screen_resolution': {
              const { stdout } = await execAsync('wmic desktopmonitor get screenheight,screenwidth /format:value');
              const width = stdout.match(/ScreenWidth=(\d+)/)?.[1];
              const height = stdout.match(/ScreenHeight=(\d+)/)?.[1];
              operation.context.result = { width, height };
              break;
            }
            default:
              throw new Error(`Unknown system setting: ${setting}`);
          }
          break;
        case 'SET':
          throw new Error('Setting system settings is not implemented');
        default:
          throw new Error(`Unsupported system settings action: ${action}`);
      }
    } catch (error) {
      this.logger.error('System settings operation failed', {
        action,
        setting,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Execute command line operations
   */
  private async executeCommand(operation: Operation): Promise<void> {
    const { command, cwd, env } = operation.params as any;
    this.logger.debug('Executing command', { command, cwd });

    try {
      const { stdout, stderr } = await execAsync(command, { cwd, env });
      operation.context.result = { stdout, stderr };
    } catch (error) {
      this.logger.error('Command execution failed', {
        command,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Validate operation before execution
   */
  private async validateOperation(operation: Operation): Promise<ValidationResult> {
    this.logger.debug('Validating operation', { 
      operationId: operation.id,
      type: operation.type
    });

    // Check system state
    const systemState = await this.getSystemState();
    if (systemState.resources.cpu > 90 || systemState.resources.memory > 90) {
      return {
        valid: false,
        errors: [{
          code: 'RESOURCE_CONSTRAINT',
          message: 'System resources are too constrained to execute operation'
        }]
      };
    }

    // Validate operation-specific parameters
    let result: ValidationResult;
    switch (operation.type) {
      case 'FILE_OPERATION':
        result = await this.validateFileOperation(operation);
        break;
      case 'WEB_NAVIGATION':
        result = this.validateWebNavigation(operation);
        break;
      case 'APP_CONTROL':
        result = this.validateAppControl(operation);
        break;
      case 'SYSTEM_SETTINGS':
        result = this.validateSystemSettings(operation);
        break;
      case 'COMMAND_EXECUTION':
        result = this.validateCommand(operation);
        break;
      default:
        result = {
          valid: false,
          errors: [{
            code: 'INVALID_OPERATION',
            message: `Unsupported operation type: ${operation.type}`
          }]
        };
    }

    this.logger.debug('Validation result', {
      operationId: operation.id,
      result
    });

    return result;
  }

  /**
   * Get current system state
   */
  private async getSystemState(): Promise<SystemState> {
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      resources: {
        cpu: cpuUsage,
        memory: memUsage,
        disk: 0, // TODO: Implement disk usage monitoring
        network: 0 // TODO: Implement network usage monitoring
      },
      activeOperations: this.activeOperations.size,
      queuedOperations: this.operationQueue.length,
      lastCheckpoint: new Date()
    };
  }

  /**
   * Validate file operations
   */
  private async validateFileOperation(operation: Operation): Promise<ValidationResult> {
    const { action, path } = operation.params as any;

    if (!path) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_PARAMS',
          message: 'File path is required'
        }]
      };
    }

    try {
      switch (action) {
        case 'READ':
          await fs.access(path);
          break;
        case 'WRITE':
          // For write operations, we'll check if the directory is writable
          const dir = dirname(path);
          await fs.access(dir).catch(async () => {
            // Directory doesn't exist, try to create it
            await fs.mkdir(dir, { recursive: true });
          });
          break;
        case 'DELETE':
          await fs.access(path);
          break;
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'FILE_ACCESS_ERROR',
          message: `File access error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  /**
   * Validate web navigation operations
   */
  private validateWebNavigation(operation: Operation): ValidationResult {
    const { action, url } = operation.params as any;

    if (action === 'NAVIGATE' && !url) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_PARAMS',
          message: 'URL is required for navigation'
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Validate app control operations
   */
  private validateAppControl(operation: Operation): ValidationResult {
    const { action, appName } = operation.params as any;

    if (!appName) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_PARAMS',
          message: 'Application name is required'
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Validate system settings operations
   */
  private validateSystemSettings(operation: Operation): ValidationResult {
    const { action, setting } = operation.params as any;

    if (!setting) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_PARAMS',
          message: 'Setting name is required'
        }]
      };
    }

    // Validate supported settings
    const supportedSettings = ['screen_resolution'];
    if (!supportedSettings.includes(setting)) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_SETTING',
          message: `Unsupported system setting: ${setting}. Supported settings are: ${supportedSettings.join(', ')}`
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Validate command execution
   */
  private validateCommand(operation: Operation): ValidationResult {
    const { command } = operation.params as any;

    if (!command) {
      return {
        valid: false,
        errors: [{
          code: 'INVALID_PARAMS',
          message: 'Command is required'
        }]
      };
    }

    return { valid: true };
  }

  /**
   * Attempt to rollback a failed operation
   */
  private async rollbackOperation(operation: Operation): Promise<void> {
    this.logger.info('Attempting operation rollback', { operationId: operation.id });
    
    try {
      switch (operation.type) {
        case 'FILE_OPERATION':
          const { action, path } = operation.params as any;
          if (action === 'WRITE' && path) {
            // Try to delete the file if it was created
            await fs.unlink(path).catch(() => {});
          }
          break;
        // Add other rollback implementations as needed
      }
      
      operation.status = 'ROLLED_BACK';
    } catch (error) {
      this.logger.error('Rollback failed', {
        operationId: operation.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}