import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
interface InteractionLog {
    timestamp: Date;
    user_input: string;
    system_prompt: string;
    claude_response: string;
    tools_used: {
        name: string;
        params: any;
        result: any;
    }[];
    success: boolean;
    error?: {
        type: string;
        message: string;
        recovery?: string;
    };
    context: {
        system_state: any;
        memory_state: any;
        tool_state: any;
    };
}
interface LogAnalysis {
    patterns: {
        successful_patterns: Pattern[];
        error_patterns: Pattern[];
        improvement_areas: Area[];
    };
    metrics: {
        success_rate: number;
        response_time: number;
        error_frequency: number;
        recovery_rate: number;
    };
    recommendations: {
        prompt_improvements: string[];
        tool_adjustments: string[];
        context_enhancements: string[];
    };
}
interface Pattern {
    type: 'success' | 'error' | 'recovery';
    frequency: number;
    context: string[];
    examples: string[];
}
interface Area {
    type: 'prompt' | 'tool' | 'context';
    description: string;
    impact: number;
    suggestions: string[];
}
export declare class LearningSystem {
    private logger;
    private toolRegistry;
    private logsDir;
    private analysisDir;
    constructor(logger: Logger, toolRegistry: ToolRegistry);
    private initializeDirs;
    logInteraction(interaction: Omit<InteractionLog, 'timestamp'>): Promise<void>;
    analyzeRecentLogs(hours?: number): Promise<LogAnalysis>;
    private getRecentLogs;
    private analyzeLogs;
    private identifyPatterns;
    private groupSimilarInteractions;
    private getInteractionContext;
    private classifyPurpose;
    private calculateMetrics;
    private calculateAverageResponseTime;
    private generateRecommendations;
    private generatePromptImprovements;
    private generateToolAdjustments;
    private generateContextEnhancements;
    private identifyPromptImprovements;
    private identifyToolImprovements;
    private identifyContextImprovements;
}
export {};
