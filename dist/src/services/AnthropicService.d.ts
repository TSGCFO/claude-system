import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
export declare class AnthropicService {
    private client;
    private logger;
    private toolRegistry;
    private context;
    private readonly maxContextLength;
    constructor(logger: Logger, toolRegistry: ToolRegistry);
    processCommand(command: string): Promise<string>;
    private prepareSystemMessage;
    private processToolCommands;
    private trimContext;
    reset(): void;
}
