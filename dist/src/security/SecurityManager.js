import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
export class SecurityManager {
    constructor(logger) {
        this.authConfig = null;
        this.logger = logger;
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
        this.loadAuthConfig();
    }
    async loadAuthConfig() {
        try {
            const configPath = path.join(process.cwd(), 'config', 'auth.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            this.authConfig = JSON.parse(configData);
            this.logger.info('Auth configuration loaded successfully');
        }
        catch (error) {
            this.logger.error('Failed to load auth configuration:', error);
            throw error;
        }
    }
    async validateUser(userId, role) {
        if (!this.authConfig) {
            await this.loadAuthConfig();
        }
        const user = this.authConfig?.users.find(u => u.userId === userId);
        return user?.role === role;
    }
    authenticate(req, res, next) {
        try {
            const token = this.extractToken(req);
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
                return;
            }
            jwt.verify(token, this.jwtSecret, (err, decoded) => {
                if (err) {
                    res.status(401).json({ error: 'Invalid token' });
                    return;
                }
                // Add decoded user to request
                req.user = decoded;
                next();
            });
        }
        catch (error) {
            this.logger.error('Authentication error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    }
    extractToken(req) {
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return req.headers.authorization.substring(7);
        }
        return null;
    }
    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '24h'
        });
    }
    verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.jwtSecret, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
    }
    async checkPermission(userId, permission) {
        if (!this.authConfig) {
            await this.loadAuthConfig();
        }
        const user = this.authConfig?.users.find(u => u.userId === userId);
        if (!user)
            return false;
        const role = this.authConfig?.roles[user.role];
        if (!role)
            return false;
        return role.permissions.includes('*') || role.permissions.includes(permission);
    }
}
//# sourceMappingURL=SecurityManager.js.map