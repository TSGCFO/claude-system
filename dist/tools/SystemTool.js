import { Tool } from './Tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
const execAsync = promisify(exec);
function bufferToString(data) {
    if (Buffer.isBuffer(data)) {
        return data.toString().trim();
    }
    return data.trim();
}
export class ExecuteCommandTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'execute_command',
            description: 'Execute a system command',
            parameters: {
                command: {
                    type: 'string',
                    description: 'Command to execute',
                    required: true
                },
                cwd: {
                    type: 'string',
                    description: 'Working directory for command execution',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const options = params.cwd ? { cwd: params.cwd } : undefined;
            const { stdout, stderr } = await execAsync(params.command, options);
            return {
                success: true,
                data: {
                    stdout: bufferToString(stdout),
                    stderr: bufferToString(stderr)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Command execution failed: ${error.message}`
            };
        }
    }
}
export class LaunchApplicationTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'launch_application',
            description: 'Launch an application',
            parameters: {
                app: {
                    type: 'string',
                    description: 'Application name or path',
                    required: true
                },
                args: {
                    type: 'array',
                    description: 'Application arguments',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const args = params.args ? params.args.join(' ') : '';
            const command = `start "" "${params.app}" ${args}`;
            const { stdout, stderr } = await execAsync(command);
            return {
                success: true,
                data: {
                    message: `Application launched: ${params.app}`,
                    stdout: bufferToString(stdout),
                    stderr: bufferToString(stderr)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to launch application: ${error.message}`
            };
        }
    }
}
export class GetSystemInfoTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'get_system_info',
            description: 'Get system information',
            parameters: {
                type: {
                    type: 'string',
                    description: 'Type of information (cpu, memory, disk, network, all)',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const type = params.type || 'all';
            const info = {};
            if (type === 'all' || type === 'cpu') {
                info.cpu = {
                    arch: os.arch(),
                    cpus: os.cpus(),
                    loadAvg: os.loadavg()
                };
            }
            if (type === 'all' || type === 'memory') {
                info.memory = {
                    total: os.totalmem(),
                    free: os.freemem(),
                    usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
                };
            }
            if (type === 'all' || type === 'disk') {
                try {
                    const command = os.platform() === 'win32'
                        ? 'wmic logicaldisk get size,freespace,caption'
                        : 'df -h';
                    const { stdout } = await execAsync(command);
                    info.disk = bufferToString(stdout);
                }
                catch (error) {
                    info.disk = 'Failed to get disk information';
                }
            }
            if (type === 'all' || type === 'network') {
                info.network = {
                    interfaces: os.networkInterfaces(),
                    hostname: os.hostname()
                };
            }
            if (type === 'all') {
                info.platform = os.platform();
                info.release = os.release();
                info.uptime = os.uptime();
                info.userInfo = os.userInfo();
            }
            return {
                success: true,
                data: info
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get system information: ${error.message}`
            };
        }
    }
}
export class ProcessControlTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'process_control',
            description: 'Control system processes',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform (list, kill)',
                    required: true
                },
                pid: {
                    type: 'number',
                    description: 'Process ID for kill action',
                    required: false
                },
                filter: {
                    type: 'string',
                    description: 'Filter for list action',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            switch (params.action) {
                case 'list':
                    return await this.listProcesses(params.filter);
                case 'kill':
                    if (!params.pid) {
                        return {
                            success: false,
                            error: 'PID is required for kill action'
                        };
                    }
                    return await this.killProcess(params.pid);
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${params.action}`
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Process control failed: ${error.message}`
            };
        }
    }
    async listProcesses(filter) {
        try {
            const command = os.platform() === 'win32'
                ? 'tasklist'
                : 'ps aux';
            const { stdout } = await execAsync(command);
            const output = bufferToString(stdout);
            const processes = output.split('\n')
                .filter(line => !filter || line.toLowerCase().includes(filter.toLowerCase()));
            return {
                success: true,
                data: processes
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to list processes: ${error.message}`
            };
        }
    }
    async killProcess(pid) {
        try {
            const command = os.platform() === 'win32'
                ? `taskkill /F /PID ${pid}`
                : `kill -9 ${pid}`;
            const { stdout, stderr } = await execAsync(command);
            return {
                success: true,
                data: {
                    message: `Process ${pid} terminated`,
                    stdout: bufferToString(stdout),
                    stderr: bufferToString(stderr)
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to kill process: ${error.message}`
            };
        }
    }
}
//# sourceMappingURL=SystemTool.js.map