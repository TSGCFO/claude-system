import { Logger } from 'winston';
interface PerformanceMetrics {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
    successRate: number;
    adaptationRate: number;
    learningEfficiency: number;
}
interface AlertConfig {
    responseTimeThreshold: number;
    memoryThreshold: number;
    cpuThreshold: number;
    errorRateThreshold: number;
    checkInterval: number;
}
export declare class PerformanceMonitor {
    private readonly logger;
    private readonly metricsDir;
    private readonly alertConfig;
    private currentMetrics;
    private readonly metricsHistory;
    private readonly maxHistorySize;
    private monitoringInterval;
    constructor(logger: Logger, config?: {
        metricsDir?: string;
        alertConfig?: Partial<AlertConfig>;
        maxHistorySize?: number;
    });
    private initialize;
    private loadHistoricalMetrics;
    private startMonitoring;
    private checkMetrics;
    private calculateSeverity;
    private handleAlerts;
    private handleCriticalAlerts;
    private optimizePerformance;
    private freeResources;
    private mitigateErrors;
    updateMetrics(metrics: Partial<PerformanceMetrics>): Promise<void>;
    getMetricsAnalysis(): Promise<{
        current: PerformanceMetrics;
        trends: {
            responseTime: number;
            errorRate: number;
            learningEfficiency: number;
        };
        recommendations: string[];
    }>;
    private analyzeTrends;
    private generateRecommendations;
    stop(): void;
}
export {};
