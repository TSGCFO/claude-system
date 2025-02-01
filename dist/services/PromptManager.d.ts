import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
export declare class PromptManager {
    private logger;
    private toolRegistry;
    constructor(logger: Logger, toolRegistry: ToolRegistry);
    getSystemPrompt(): string;
    private formatToolDescriptions;
    private generateExamples;
    getErrorRecoveryPrompt(error: any): string;
    getStateUpdatePrompt(state: any): string;
    getSuccessPrompt(result: any): string;
}
