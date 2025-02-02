import * as fs from 'fs/promises';
import * as path from 'path';
export class PerformanceMonitor {
    constructor(logger, config = {}) {
        this.monitoringInterval = null;
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
    async initialize() {
        try {
            await fs.mkdir(this.metricsDir, { recursive: true });
            await this.loadHistoricalMetrics();
            this.startMonitoring();
            this.logger.info('PerformanceMonitor initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize PerformanceMonitor:', error);
        }
    }
    async loadHistoricalMetrics() {
        try {
            const files = await fs.readdir(this.metricsDir);
            const metricsFiles = files
                .filter(file => file.endsWith('.json'))
                .sort()
                .slice(-this.maxHistorySize);
            for (const file of metricsFiles) {
                const content = await fs.readFile(path.join(this.metricsDir, file), 'utf-8');
                const metrics = JSON.parse(content);
                this.metricsHistory.push(metrics);
            }
            this.logger.debug(`Loaded ${this.metricsHistory.length} historical metrics`);
        }
        catch (error) {
            this.logger.error('Failed to load historical metrics:', error);
        }
    }
    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(() => this.checkMetrics(), this.alertConfig.checkInterval);
    }
    async checkMetrics() {
        try {
            const alerts = [];
            // Check response time
            if (this.currentMetrics.responseTime > this.alertConfig.responseTimeThreshold) {
                alerts.push({
                    timestamp: new Date().toISOString(),
                    type: 'performance',
                    severity: this.calculateSeverity(this.currentMetrics.responseTime, this.alertConfig.responseTimeThreshold),
                    message: 'Response time exceeded threshold',
                    metrics: { responseTime: this.currentMetrics.responseTime }
                });
            }
            // Check memory usage
            if (this.currentMetrics.memoryUsage > this.alertConfig.memoryThreshold) {
                alerts.push({
                    timestamp: new Date().toISOString(),
                    type: 'resource',
                    severity: this.calculateSeverity(this.currentMetrics.memoryUsage, this.alertConfig.memoryThreshold),
                    message: 'Memory usage exceeded threshold',
                    metrics: { memoryUsage: this.currentMetrics.memoryUsage }
                });
            }
            // Check error rate
            if (this.currentMetrics.errorRate > this.alertConfig.errorRateThreshold) {
                alerts.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    severity: this.calculateSeverity(this.currentMetrics.errorRate, this.alertConfig.errorRateThreshold),
                    message: 'Error rate exceeded threshold',
                    metrics: { errorRate: this.currentMetrics.errorRate }
                });
            }
            if (alerts.length > 0) {
                await this.handleAlerts(alerts);
            }
        }
        catch (error) {
            this.logger.error('Failed to check metrics:', error);
        }
    }
    calculateSeverity(value, threshold) {
        const ratio = value / threshold;
        if (ratio >= 2)
            return 'critical';
        if (ratio >= 1.5)
            return 'high';
        if (ratio >= 1.2)
            return 'medium';
        return 'low';
    }
    async handleAlerts(alerts) {
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
        }
        catch (error) {
            this.logger.error('Failed to handle alerts:', error);
        }
    }
    async handleCriticalAlerts(alerts) {
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
    async optimizePerformance() {
        // Implement performance optimization strategies
        this.logger.info('Initiating performance optimization');
        // Add optimization logic here
    }
    async freeResources() {
        // Implement resource cleanup
        this.logger.info('Initiating resource cleanup');
        // Add cleanup logic here
    }
    async mitigateErrors() {
        // Implement error mitigation strategies
        this.logger.info('Initiating error mitigation');
        // Add mitigation logic here
    }
    async updateMetrics(metrics) {
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
        }
        catch (error) {
            this.logger.error('Failed to update metrics:', error);
        }
    }
    async getMetricsAnalysis() {
        const trends = this.analyzeTrends();
        const recommendations = this.generateRecommendations(trends);
        return {
            current: this.currentMetrics,
            trends,
            recommendations
        };
    }
    analyzeTrends() {
        if (this.metricsHistory.length < 2) {
            return {
                responseTime: 0,
                errorRate: 0,
                learningEfficiency: 0
            };
        }
        const recentMetrics = this.metricsHistory.slice(-10);
        const calculateTrend = (metric) => {
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
    generateRecommendations(trends) {
        const recommendations = [];
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
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map