import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
import { LearningSystem } from './LearningSystem.js';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor.js';
import { QualityController } from '../quality/QualityController.js';
import { RoleManager } from '../roles/RoleManager.js';
export declare class ToolInitializer {
    private static instance;
    private toolRegistry;
    private logger;
    private initialized;
    private constructor();
    static getInstance(logger: Logger): ToolInitializer;
    initialize(logger: Logger): Promise<ToolRegistry>;
    reinitialize(logger: Logger, learningSystem: LearningSystem, performanceMonitor?: PerformanceMonitor, qualityController?: QualityController, roleManager?: RoleManager): Promise<ToolRegistry>;
    private registerTools;
    private registerExperimentalTools;
    private wrapToolsWithEnhancements;
    cleanup(): Promise<void>;
}
