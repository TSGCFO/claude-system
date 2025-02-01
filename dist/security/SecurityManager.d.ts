import { User, Session, SecurityEvent, AuditLog, Operation } from '../types/core.js';
export declare class SecurityManager {
    private sessions;
    private logger;
    constructor();
    /**
     * Authenticate a user and create a new session
     */
    authenticate(credentials: {
        username: string;
        password: string;
    }): Promise<Session>;
    /**
     * Validate session and update last activity
     */
    validateSession(sessionId: string): Promise<boolean>;
    /**
     * Check if user has required permissions for operation
     */
    authorizeOperation(operation: Operation, user: User): Promise<boolean>;
    /**
     * Get required permissions for operation type
     */
    private getRequiredPermissions;
    /**
     * Log security events
     */
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    /**
     * Log audit events
     */
    logAudit(log: AuditLog): Promise<void>;
    /**
     * Validate resource access
     */
    validateResourceAccess(userId: string, resourceType: string, resourceId: string, action: string): Promise<boolean>;
    /**
     * Clean up expired sessions
     */
    cleanupSessions(): Promise<void>;
    /**
     * Start periodic session cleanup
     */
    startSessionCleanup(intervalMs?: number): void;
}
