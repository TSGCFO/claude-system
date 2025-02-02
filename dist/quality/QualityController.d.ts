import { Logger } from 'winston';
interface QualityMetrics {
    accuracy: number;
    completeness: number;
    consistency: number;
    relevance: number;
    confidence: number;
}
interface ValidationRule {
    name: string;
    description: string;
    validate: (response: any) => Promise<ValidationResult>;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
interface ValidationResult {
    passed: boolean;
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
}
interface ValidationIssue {
    rule: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    context?: any;
}
interface QualityConfig {
    minAccuracy: number;
    minCompleteness: number;
    minConsistency: number;
    minRelevance: number;
    minConfidence: number;
}
export declare class QualityController {
    private readonly logger;
    private readonly config;
    private readonly validationRules;
    private readonly qualityLogsDir;
    constructor(logger: Logger, config?: Partial<QualityConfig>, customRules?: ValidationRule[]);
    private initialize;
    private getDefaultRules;
    validateResponse(response: any): Promise<ValidationResult>;
    private logValidation;
    private calculateAccuracy;
    private calculateCompleteness;
    private calculateConsistency;
    improveResponse(response: any, validationResult: ValidationResult): Promise<any>;
    private applyImprovement;
    private improveAccuracy;
    private improveCompleteness;
    private improveConsistency;
    getQualityMetrics(): Promise<QualityMetrics>;
}
export {};
