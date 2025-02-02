import express from 'express';
export function createAuthRouter(logger, securityManager) {
    const router = express.Router();
    router.post('/token', async (req, res) => {
        try {
            const { userId, role } = req.body;
            if (!userId || !role) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            // Validate user against configuration
            const isValid = await securityManager.validateUser(userId, role);
            if (!isValid) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            // Generate JWT token
            const token = securityManager.generateToken({
                userId,
                role,
                timestamp: new Date().toISOString()
            });
            res.json({ token });
        }
        catch (error) {
            logger.error('Token generation error:', error);
            res.status(500).json({ error: 'Failed to generate token' });
        }
    });
    router.get('/validate', async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'No token provided' });
                return;
            }
            const decoded = await securityManager.verifyToken(token);
            res.json({ valid: true, user: decoded });
        }
        catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    });
    return router;
}
//# sourceMappingURL=auth.js.map