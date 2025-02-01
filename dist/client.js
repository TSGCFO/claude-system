import axios from 'axios';
import { createLogger, format, transports } from 'winston';
export class ComputerControlClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.logger = createLogger({
            level: 'debug',
            format: format.combine(format.timestamp(), format.json()),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'logs/client.log' })
            ]
        });
    }
    /**
     * Get list of available tools
     */
    async getTools() {
        try {
            const response = await axios.get(`${this.baseUrl}/tools`);
            return response.data.tools;
        }
        catch (error) {
            this.logger.error('Failed to get tools', { error });
            throw new Error(`Failed to get tools: ${error?.message || 'Unknown error'}`);
        }
    }
    /**
     * Execute a tool with given parameters
     */
    async executeTool(name, params) {
        try {
            this.logger.debug('Executing tool', { name, params });
            const response = await axios.post(`${this.baseUrl}/execute/${name}`, params);
            return response.data;
        }
        catch (error) {
            this.logger.error('Tool execution failed', { name, params, error });
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Unknown error'
            };
        }
    }
    // Convenience methods for common operations
    /**
     * Read a file
     */
    async readFile(path) {
        const result = await this.executeTool('read_file', { path });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
    /**
     * Write to a file
     */
    async writeFile(path, content) {
        const result = await this.executeTool('write_file', { path, content });
        if (!result.success) {
            throw new Error(result.error);
        }
    }
    /**
     * Navigate to a website
     */
    async navigateWeb(url) {
        const result = await this.executeTool('navigate_web', { url });
        if (!result.success) {
            throw new Error(result.error);
        }
    }
    /**
     * Click an element on the webpage
     */
    async clickElement(selector, coordinates, text) {
        const result = await this.executeTool('click_element', { selector, coordinates, text });
        if (!result.success) {
            throw new Error(result.error);
        }
    }
    /**
     * Execute a system command
     */
    async executeCommand(command, cwd) {
        const result = await this.executeTool('execute_command', { command, cwd });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
    /**
     * Launch an application
     */
    async launchApplication(name, args) {
        const result = await this.executeTool('launch_application', { name, args });
        if (!result.success) {
            throw new Error(result.error);
        }
    }
    /**
     * Get system information
     */
    async getSystemInfo(type) {
        const result = await this.executeTool('get_system_info', { type });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    }
}
// Export a default instance
export default new ComputerControlClient();
//# sourceMappingURL=client.js.map