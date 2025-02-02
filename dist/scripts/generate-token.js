import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
// Load environment variables
config();
// Use the same secret as in SecurityManager
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
// Create a token with basic user info
const token = jwt.sign({
    userId: '1',
    role: 'admin'
}, JWT_SECRET, { expiresIn: '24h' });
console.log('Generated Token:');
console.log(token);
//# sourceMappingURL=generate-token.js.map