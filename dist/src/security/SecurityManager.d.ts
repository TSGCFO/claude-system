import { Logger } from 'winston';
export declare class SecurityManager {
    private logger;
    private readonly jwtSecret;
    private authConfig;
    constructor(logger: Logger);
    private loadAuthConfig;
    validateUser(userId: string, role: string): Promise<boolean>;
    authenticate(req: any, res: any, next: any): void;
    private extractToken;
    generateToken(payload: any): string;
    verifyToken(token: string): Promise<any>;
    checkPermission(userId: string, permission: string): Promise<boolean>;
}
