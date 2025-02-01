import { User, Permission, Session, SecurityEvent, AuditLog, Operation, OperationType } from '../types/core.js';
import { randomUUID } from 'node:crypto';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { setTimeout, setInterval } from 'node:timers';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const {
  CLAUDE_SYSTEM_USERNAME,
  CLAUDE_SYSTEM_PASSWORD,
  JWT_SECRET = 'default-secret-change-this'
} = process.env;

if (!CLAUDE_SYSTEM_USERNAME || !CLAUDE_SYSTEM_PASSWORD) {
  console.error('Error: CLAUDE_SYSTEM_USERNAME and CLAUDE_SYSTEM_PASSWORD must be set in .env file');
  process.exit(1);
}

export class SecurityManager {
  private sessions: Map<string, Session>;
  private logger: Logger;

  constructor() {
    this.sessions = new Map();
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/security.log' }),
        new transports.File({ filename: 'logs/audit.log', level: 'info' })
      ]
    });
  }

  /**
   * Authenticate a user and create a new session
   */
  async authenticate(credentials: { username: string; password: string }): Promise<Session> {
    // Verify credentials
    if (credentials.username !== CLAUDE_SYSTEM_USERNAME || 
        credentials.password !== CLAUDE_SYSTEM_PASSWORD) {
      this.logger.warn('Authentication failed', { username: credentials.username });
      throw new Error('Invalid credentials');
    }

    const userId = randomUUID();
    const sessionId = randomUUID();

    // Create JWT token
    const token = jwt.sign(
      { userId, sessionId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const session: Session = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      lastActivity: new Date(),
      token
    };

    this.sessions.set(session.id, session);
    await this.logSecurityEvent({
      id: randomUUID(),
      timestamp: new Date(),
      severity: 'LOW',
      type: 'USER_LOGIN',
      details: { userId },
      userId
    });

    return session;
  }

  /**
   * Validate session and update last activity
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    try {
      // Verify JWT token
      jwt.verify(session.token, JWT_SECRET);
    } catch (error) {
      this.logger.warn('Invalid session token', { sessionId });
      return false;
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      await this.logSecurityEvent({
        id: randomUUID(),
        timestamp: new Date(),
        severity: 'LOW',
        type: 'SESSION_EXPIRED',
        details: { sessionId },
        userId: session.userId
      });
      return false;
    }

    session.lastActivity = new Date();
    return true;
  }

  /**
   * Check if user has required permissions for operation
   */
  async authorizeOperation(operation: Operation, user: User): Promise<boolean> {
    const requiredPermissions = this.getRequiredPermissions(operation.type);
    const hasPermissions = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );

    await this.logAudit({
      id: randomUUID(),
      timestamp: new Date(),
      operationId: operation.id,
      userId: user.id,
      action: 'OPERATION_AUTHORIZATION',
      details: {
        operationType: operation.type,
        requiredPermissions,
        authorized: hasPermissions
      },
      status: hasPermissions ? 'SUCCESS' : 'FAILURE'
    });

    return hasPermissions;
  }

  /**
   * Get required permissions for operation type
   */
  private getRequiredPermissions(operationType: OperationType): Permission[] {
    const permissionMap: Record<OperationType, Permission[]> = {
      'FILE_OPERATION': ['FILE_READ', 'FILE_WRITE'],
      'WEB_NAVIGATION': ['WEB_ACCESS'],
      'APP_CONTROL': ['APP_CONTROL'],
      'SYSTEM_SETTINGS': ['SYSTEM_SETTINGS'],
      'COMMAND_EXECUTION': ['COMMAND_EXEC']
    };

    return permissionMap[operationType] || [];
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    this.logger.warn('Security Event', { event });
  }

  /**
   * Log audit events
   */
  async logAudit(log: AuditLog): Promise<void> {
    this.logger.info('Audit Log', { log });
  }

  /**
   * Validate resource access
   */
  async validateResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    // TODO: Implement resource-level access control
    // This is a placeholder implementation
    await this.logAudit({
      id: randomUUID(),
      timestamp: new Date(),
      userId,
      action: 'RESOURCE_ACCESS',
      details: {
        resourceType,
        resourceId,
        action
      },
      resourceId,
      status: 'SUCCESS'
    });

    return true;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        await this.logSecurityEvent({
          id: randomUUID(),
          timestamp: now,
          severity: 'LOW',
          type: 'SESSION_CLEANUP',
          details: { sessionId },
          userId: session.userId
        });
      }
    }
  }

  /**
   * Start periodic session cleanup
   */
  startSessionCleanup(intervalMs: number = 60 * 60 * 1000): void {
    setInterval(() => {
      this.cleanupSessions().catch(error => {
        this.logger.error('Session cleanup error', { error });
      });
    }, intervalMs);
  }
}