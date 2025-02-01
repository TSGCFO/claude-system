/**
 * Core types for the Claude System
 */
export interface User {
    id: string;
    permissions: Permission[];
    sessionId?: string;
}
export interface Session {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    lastActivity: Date;
    token: string;
}
export type Permission = 'FILE_READ' | 'FILE_WRITE' | 'SYSTEM_SETTINGS' | 'APP_CONTROL' | 'WEB_ACCESS' | 'COMMAND_EXEC';
export interface OperationContext {
    user?: User;
    session?: Session;
    timestamp: Date;
    traceId: string;
    result?: Record<string, any>;
}
export interface Operation<T = unknown> {
    id: string;
    type: OperationType;
    params: T;
    context: OperationContext;
    priority: OperationPriority;
    status: OperationStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: OperationError;
}
export type OperationType = 'FILE_OPERATION' | 'WEB_NAVIGATION' | 'APP_CONTROL' | 'SYSTEM_SETTINGS' | 'COMMAND_EXECUTION';
export type OperationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OperationStatus = 'PENDING' | 'VALIDATING' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
export interface OperationError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
}
export interface ValidationError {
    code: string;
    message: string;
    field?: string;
}
export interface ResourceUsage {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
}
export interface SystemState {
    resources: ResourceUsage;
    activeOperations: number;
    queuedOperations: number;
    lastCheckpoint: Date;
}
export interface NLIRequest {
    text: string;
    context?: Record<string, unknown>;
}
export interface NLIResponse {
    operation?: Operation;
    clarificationNeeded?: boolean;
    clarificationQuestion?: string;
    confidence: number;
    alternatives?: Operation[];
}
export interface FileOperationParams {
    action: 'READ' | 'WRITE' | 'DELETE' | 'MOVE' | 'COPY';
    path: string;
    destination?: string;
    content?: string;
    options?: Record<string, unknown>;
}
export interface WebNavigationParams {
    action: 'NAVIGATE' | 'CLICK' | 'TYPE' | 'SCROLL' | 'SCREENSHOT';
    url?: string;
    selector?: string;
    text?: string;
    coordinates?: {
        x: number;
        y: number;
    };
}
export interface AppControlParams {
    action: 'LAUNCH' | 'CLOSE' | 'FOCUS' | 'MINIMIZE' | 'MAXIMIZE';
    appName: string;
    processId?: number;
    options?: Record<string, unknown>;
}
export interface SystemSettingsParams {
    action: 'GET' | 'SET';
    setting: string;
    value?: unknown;
}
export interface CommandExecutionParams {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
}
export interface AuditLog {
    id: string;
    timestamp: Date;
    operationId?: string;
    userId: string;
    action: string;
    details: Record<string, unknown>;
    resourceId?: string;
    status: 'SUCCESS' | 'FAILURE';
}
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
    details: Record<string, unknown>;
    userId?: string;
    sourceIp?: string;
}
