import { Logger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

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

interface Alert {
  timestamp: string;
  type: 'performance' | 'resource' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: Partial<PerformanceMetrics>;
}

export class PerformanceMonitor {
  private readonly logger: Logger;
  private readonly metricsDir: string;
  private readonly alertConfig: AlertConfig;
  private currentMetrics: PerformanceMetrics;
  private readonly metricsHistory: PerformanceMetrics[];
  private readonly maxHistorySize: number;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    logger: Logger,
    config: {
      metricsDir?: string;
      alertConfig?: Partial<AlertConfig>;
      maxHistorySize?: number;
    } = {}
  ) {
    this.logger = logger;
    this.metricsDir = config.metricsDir || path.join(process.cwd(), 'logs', 'metrics');
    this.maxHistorySize = config.maxHistorySize || 1000;
    this.metricsHistory = [];
    
    this.alertConfig = {
      responseTimeThreshold: config.alertConfig?.responseTimeThreshold || 2000, // 2 seconds
      memoryThreshold: config.alertConfig?.memoryThreshold || 0.8, // 80%
      cpuThreshold: config.alertConfig?.cpuThreshold || 0.7, // 70%
      errorRateThreshold: config.alertConfig?.errorRateThreshold || 0.1, // 10%
      checkInterval: config.alertConfig?.checkInterval || 60000, // 1 minute
    };

    this.currentMetrics = {
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorRate: 0,
      successRate: 1,
      adaptationRate: 0,
      learningEfficiency: 0
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
      await this.loadHistoricalMetrics();
      this.startMonitoring();
      this.logger.info('PerformanceMonitor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PerformanceMonitor:', error);
    }
  }

  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const files = await fs.readdir(this.metricsDir);
      const metricsFiles = files
        .filter(file => file.endsWith('.json'))
        .sort()
        .slice(-this.maxHistorySize);

      for (const file of metricsFiles) {
        const content = await fs.readFile(path.join(this.metricsDir, file), 'utf-8');
        const metrics: PerformanceMetrics = JSON.parse(content);
        this.metricsHistory.push(metrics);
      }

      this.logger.debug(`Loaded ${this.metricsHistory.length} historical metrics`);
    } catch (error) {
      this.logger.error('Failed to load historical metrics:', error);
    }
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(
      () => this.checkMetrics(),
      this.alertConfig.checkInterval
    ) as unknown as NodeJS.Timeout;
  }

  private async checkMetrics(): Promise<void> {
    try {
      const alerts: Alert[] = [];

      // Check response time
      if (this.currentMetrics.responseTime > this.alertConfig.responseTimeThreshold) {
        alerts.push({
          timestamp: new Date().toISOString(),
          type: 'performance',
          severity: this.calculateSeverity(
            this.currentMetrics.responseTime,
            this.alertConfig.responseTimeThreshold
          ),
          message: 'Response time exceeded threshold',
          metrics: { responseTime: this.currentMetrics.responseTime }
        });
      }

      // Check memory usage
      if (this.currentMetrics.memoryUsage > this.alertConfig.memoryThreshold) {
        alerts.push({
          timestamp: new Date().toISOString(),
          type: 'resource',
          severity: this.calculateSeverity(
            this.currentMetrics.memoryUsage,
            this.alertConfig.memoryThreshold
          ),
          message: 'Memory usage exceeded threshold',
          metrics: { memoryUsage: this.currentMetrics.memoryUsage }
        });
      }

      // Check error rate
      if (this.currentMetrics.errorRate > this.alertConfig.errorRateThreshold) {
        alerts.push({
          timestamp: new Date().toISOString(),
          type: 'error',
          severity: this.calculateSeverity(
            this.currentMetrics.errorRate,
            this.alertConfig.errorRateThreshold
          ),
          message: 'Error rate exceeded threshold',
          metrics: { errorRate: this.currentMetrics.errorRate }
        });
      }

      if (alerts.length > 0) {
        await this.handleAlerts(alerts);
      }
    } catch (error) {
      this.logger.error('Failed to check metrics:', error);
    }
  }

  private calculateSeverity(
    value: number,
    threshold: number
  ): Alert['severity'] {
    const ratio = value / threshold;
    if (ratio >= 2) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  private async handleAlerts(alerts: Alert[]): Promise<void> {
    try {
      // Log alerts
      alerts.forEach(alert => {
        this.logger.warn('Performance alert:', alert);
      });

      // Store alerts
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const alertsPath = path.join(this.metricsDir, `alerts-${timestamp}.json`);
      await fs.writeFile(alertsPath, JSON.stringify(alerts, null, 2));

      // Take action based on severity
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        await this.handleCriticalAlerts(criticalAlerts);
      }
    } catch (error) {
      this.logger.error('Failed to handle alerts:', error);
    }
  }

  private async handleCriticalAlerts(alerts: Alert[]): Promise<void> {
    // Implement automatic recovery actions
    for (const alert of alerts) {
      switch (alert.type) {
        case 'performance':
          await this.optimizePerformance();
          break;
        case 'resource':
          await this.freeResources();
          break;
        case 'error':
          await this.mitigateErrors();
          break;
      }
    }
  }

  private async optimizePerformance(): Promise<void> {
    // Implement performance optimization strategies
    this.logger.info('Initiating performance optimization');
    // Add optimization logic here
  }

  private async freeResources(): Promise<void> {
    // Implement resource cleanup
    this.logger.info('Initiating resource cleanup');
    // Add cleanup logic here
  }

  private async mitigateErrors(): Promise<void> {
    // Implement error mitigation strategies
    this.logger.info('Initiating error mitigation');
    // Add mitigation logic here
  }

  public async updateMetrics(metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      this.currentMetrics = {
        ...this.currentMetrics,
        ...metrics
      };

      this.metricsHistory.push(this.currentMetrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // Store metrics
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const metricsPath = path.join(this.metricsDir, `metrics-${timestamp}.json`);
      await fs.writeFile(metricsPath, JSON.stringify(this.currentMetrics, null, 2));

      this.logger.debug('Metrics updated:', this.currentMetrics);
    } catch (error) {
      this.logger.error('Failed to update metrics:', error);
    }
  }

  public async getMetricsAnalysis(): Promise<{
    current: PerformanceMetrics;
    trends: {
      responseTime: number;
      errorRate: number;
      learningEfficiency: number;
    };
    recommendations: string[];
  }> {
    const trends = this.analyzeTrends();
    const recommendations = this.generateRecommendations(trends);

    return {
      current: this.currentMetrics,
      trends,
      recommendations
    };
  }

  private analyzeTrends(): {
    responseTime: number;
    errorRate: number;
    learningEfficiency: number;
  } {
    if (this.metricsHistory.length < 2) {
      return {
        responseTime: 0,
        errorRate: 0,
        learningEfficiency: 0
      };
    }

    const recentMetrics = this.metricsHistory.slice(-10);
    const calculateTrend = (metric: keyof PerformanceMetrics): number => {
      const values = recentMetrics.map(m => m[metric]);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      return firstValue === 0 ? 0 : (lastValue - firstValue) / firstValue;
    };

    return {
      responseTime: calculateTrend('responseTime'),
      errorRate: calculateTrend('errorRate'),
      learningEfficiency: calculateTrend('learningEfficiency')
    };
  }

  private generateRecommendations(trends: {
    responseTime: number;
    errorRate: number;
    learningEfficiency: number;
  }): string[] {
    const recommendations: string[] = [];

    if (trends.responseTime > 0.1) {
      recommendations.push('Response time is increasing. Consider performance optimization.');
    }

    if (trends.errorRate > 0.05) {
      recommendations.push('Error rate is increasing. Review error patterns and implement fixes.');
    }

    if (trends.learningEfficiency < 0) {
      recommendations.push('Learning efficiency is decreasing. Review and adjust learning parameters.');
    }

    return recommendations;
  }

  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval as unknown as number);
      this.monitoringInterval = null;
    }
  }
}