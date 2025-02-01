import { Operation } from '../types/core.js';
import { SecurityManager } from '../security/SecurityManager.js';
export declare class OperationExecutor {
    private securityManager;
    private browser;
    private operationQueue;
    private activeOperations;
    private logger;
    constructor(securityManager: SecurityManager);
    /**
     * Execute an operation
     */
    executeOperation(operation: Operation): Promise<void>;
    /**
     * Execute file system operations
     */
    private executeFileOperation;
    /**
     * Execute web navigation operations
     */
    private executeWebNavigation;
    /**
     * Execute application control operations
     */
    private executeAppControl;
    /**
     * Execute system settings operations
     */
    private executeSystemSettings;
    /**
     * Execute command line operations
     */
    private executeCommand;
    /**
     * Validate operation before execution
     */
    private validateOperation;
    /**
     * Get current system state
     */
    private getSystemState;
    /**
     * Validate file operations
     */
    private validateFileOperation;
    /**
     * Validate web navigation operations
     */
    private validateWebNavigation;
    /**
     * Validate app control operations
     */
    private validateAppControl;
    /**
     * Validate system settings operations
     */
    private validateSystemSettings;
    /**
     * Validate command execution
     */
    private validateCommand;
    /**
     * Attempt to rollback a failed operation
     */
    private rollbackOperation;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
