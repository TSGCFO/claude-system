import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
interface InteractionLog {
    timestamp: string;
    command: string;
    response: string;
    tools_used: string[];
    success: boolean;
    error?: string;
    duration: number;
    context?: string;
    confidence?: number;
    feedback?: UserFeedback;
}
interface UserFeedback {
    rating: number;
    comments?: string;
    helpfulness?: number;
    accuracy?: number;
}
interface Pattern {
    type: string;
    frequency: number;
    success_rate?: number;
    confidence?: number;
    context_relevance?: number;
    adaptations?: PatternAdaptation[];
}
interface PatternAdaptation {
    timestamp: string;
    change: string;
    impact: number;
    context: string;
}
interface LogAnalysis {
    metrics: {
        success_rate: number;
        error_frequency: number;
        response_time: number;
        recovery_rate: number;
        adaptation_effectiveness: number;
        learning_rate: number;
        confidence_accuracy: number;
    };
    patterns: {
        successful_patterns: Pattern[];
        error_patterns: Pattern[];
        emerging_patterns: Pattern[];
        deprecated_patterns: Pattern[];
    };
    recommendations: {
        immediate: string[];
        long_term: string[];
        adaptations: string[];
    };
}
export declare class LearningSystem {
    private logger;
    private toolRegistry;
    private readonly logDir;
    private readonly interactionsDir;
    private patternCache;
    private readonly cacheTimeout;
    private lastCacheUpdate;
    private learningMetrics;
    private readonly adaptationThreshold;
    private readonly confidenceThreshold;
    constructor(logger: Logger, toolRegistry: ToolRegistry, config?: {
        cacheTimeout?: number;
        adaptationThreshold?: number;
        confidenceThreshold?: number;
    });
    private initialize;
    private initializeLearningMetrics;
    private updateLearningMetrics;
    private ensureDirectories;
    private loadPatternCache;
    logInteraction(interaction: Omit<InteractionLog, 'timestamp'>): Promise<void>;
    private shouldAdaptPatterns;
    private adaptPatterns;
    private determineAdaptation;
    analyzeRecentLogs(hours: number): Promise<LogAnalysis>;
    private analyzePatterns;
    private categorizeCommand;
    getRecommendation(context: string): Promise<string[]>;
    updateToolEffectiveness(toolName: string, success: boolean): Promise<void>;
    private calculateAdaptationEffectiveness;
    private calculateLearningRate;
    private findEmergingPatterns;
    private findDeprecatedPatterns;
    private generateRecommendations;
}
export {};
