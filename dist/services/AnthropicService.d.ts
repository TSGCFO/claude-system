import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
export declare class AnthropicService {
    private client;
    private logger;
    private toolRegistry;
    private learningSystem;
    private promptManager;
    private state;
    constructor(logger: Logger, toolRegistry: ToolRegistry);
    processCommand(command: string): Promise<string>;
    private updateState;
    reset(): void;
}
