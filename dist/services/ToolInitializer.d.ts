import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
import { LearningSystem } from './LearningSystem.js';
export declare class ToolInitializer {
    private static instance;
    private toolRegistry;
    private initialized;
    private logger;
    private browserTool?;
    private constructor();
    static getInstance(logger: Logger): ToolInitializer;
    private createBaseTools;
    initialize(logger: Logger, learningSystem?: LearningSystem): Promise<ToolRegistry>;
    getToolRegistry(): ToolRegistry;
    cleanup(): Promise<void>;
    reinitialize(logger: Logger, learningSystem: LearningSystem): Promise<ToolRegistry>;
    reset(): void;
}
