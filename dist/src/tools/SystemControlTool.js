import { Tool } from './Tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
const execAsync = promisify(exec);
export class SystemControlTool extends Tool {
    constructor(logger) {
        super(logger);
        this.processes = new Map();
    }
    get metadata() {
        return {
            name: 'system_control',
            description: 'Control system operations and processes',
            parameters: {
                operation: {
                    type: 'string',
                    description: 'Operation to perform (execute, kill, status, info)',
                    required: true
                },
                command: {
                    type: 'string',
                    description: 'Command to execute (for execute operation)',
                    required: false
                },
                processId: {
                    type: 'string',
                    description: 'Process ID (for kill operation)',
                    required: false
                },
                timeout: {
                    type: 'number',
                    description: 'Command timeout in milliseconds',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const { operation, command, processId, timeout = 30000 } = params;
            switch (operation) {
                case 'execute':
                    return await this.executeCommand(command, timeout);
                case 'kill':
                    return await this.killProcess(processId);
                case 'status':
                    return await this.getProcessStatus(processId);
                case 'info':
                    return await this.getSystemInfo();
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        }
        catch (error) {
            this.logger.error('System control operation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async executeCommand(command, timeout = 30000) {
        try {
            if (!command) {
                throw new Error('Command is required for execute operation');
            }
            // Security check
            this.validateCommand(command);
            const { stdout, stderr } = await execAsync(command, { timeout });
            return {
                success: true,
                data: {
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                }
            };
        }
        catch (error) {
            throw new Error(`Command execution failed: ${error.message}`);
        }
    }
    validateCommand(command) {
        // List of potentially dangerous commands
        const dangerousCommands = [
            'rm -rf',
            'format',
            'mkfs',
            'dd',
            'wget',
            'curl',
            '>',
            '|',
            ';',
            '&&',
            '||'
        ];
        // Check for dangerous commands
        for (const dangerous of dangerousCommands) {
            if (command.toLowerCase().includes(dangerous.toLowerCase())) {
                throw new Error(`Command contains potentially dangerous operation: ${dangerous}`);
            }
        }
        // Validate command structure
        if (!/^[a-zA-Z0-9\s._/-]+$/.test(command)) {
            throw new Error('Command contains invalid characters');
        }
    }
    async killProcess(processId) {
        try {
            if (!processId) {
                throw new Error('Process ID is required for kill operation');
            }
            const process = this.processes.get(processId);
            if (!process) {
                throw new Error(`Process not found: ${processId}`);
            }
            process.kill();
            this.processes.delete(processId);
            return {
                success: true,
                data: `Process ${processId} terminated`
            };
        }
        catch (error) {
            throw new Error(`Failed to kill process: ${error.message}`);
        }
    }
    async getProcessStatus(processId) {
        try {
            if (!processId) {
                throw new Error('Process ID is required for status operation');
            }
            const process = this.processes.get(processId);
            if (!process) {
                throw new Error(`Process not found: ${processId}`);
            }
            return {
                success: true,
                data: {
                    pid: process.pid,
                    running: !process.killed,
                    exitCode: process.exitCode
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to get process status: ${error.message}`);
        }
    }
    async getSystemInfo() {
        try {
            const info = {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                uptime: os.uptime(),
                loadAvg: os.loadavg(),
                networkInterfaces: os.networkInterfaces()
            };
            return {
                success: true,
                data: info
            };
        }
        catch (error) {
            throw new Error(`Failed to get system info: ${error.message}`);
        }
    }
    async cleanup() {
        // Kill all running processes
        for (const [processId, process] of this.processes.entries()) {
            try {
                process.kill();
                this.processes.delete(processId);
            }
            catch (error) {
                this.logger.error(`Failed to kill process ${processId}:`, error);
            }
        }
    }
}
//# sourceMappingURL=SystemControlTool.js.map