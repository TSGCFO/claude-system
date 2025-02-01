import { User, Session } from './types/core.js';
export declare class ClaudeSystem {
    private securityManager;
    private nli;
    private executor;
    private logger;
    constructor();
    /**
     * Process a natural language command
     */
    processCommand(command: string, user: User, session: Session): Promise<{
        success: boolean;
        message: string;
        error?: Error;
        result?: any;
    }>;
    /**
     * Authenticate user and create session
     */
    login(credentials: {
        username: string;
        password: string;
    }): Promise<{
        user: User;
        session: Session;
    }>;
    /**
     * Clean up system resources
     */
    shutdown(): Promise<void>;
}
export declare function createServer(system: ClaudeSystem): import("@types/express-serve-static-core/index.js").Express;
