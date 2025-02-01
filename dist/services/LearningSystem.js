import * as fs from 'fs/promises';
import * as path from 'path';
export class LearningSystem {
    constructor(logger, toolRegistry) {
        this.logger = logger;
        this.toolRegistry = toolRegistry;
        this.logsDir = path.join(process.cwd(), 'logs', 'interactions');
        this.analysisDir = path.join(process.cwd(), 'logs', 'analysis');
        this.initializeDirs();
    }
    async initializeDirs() {
        try {
            await fs.mkdir(this.logsDir, { recursive: true });
            await fs.mkdir(this.analysisDir, { recursive: true });
        }
        catch (error) {
            this.logger.error('Failed to initialize log directories', error);
        }
    }
    async logInteraction(interaction) {
        try {
            const log = {
                ...interaction,
                timestamp: new Date()
            };
            const filename = `${log.timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
            await fs.writeFile(path.join(this.logsDir, filename), JSON.stringify(log, null, 2));
            this.logger.debug('Logged interaction', { filename });
        }
        catch (error) {
            this.logger.error('Failed to log interaction', error);
        }
    }
    async analyzeRecentLogs(hours = 24) {
        try {
            const logs = await this.getRecentLogs(hours);
            return this.analyzeLogs(logs);
        }
        catch (error) {
            this.logger.error('Failed to analyze logs', error);
            throw error;
        }
    }
    async getRecentLogs(hours) {
        const files = await fs.readdir(this.logsDir);
        const now = new Date();
        const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const logs = [];
        for (const file of files) {
            const content = await fs.readFile(path.join(this.logsDir, file), 'utf-8');
            const log = JSON.parse(content);
            if (new Date(log.timestamp) >= cutoff) {
                logs.push(log);
            }
        }
        return logs;
    }
    analyzeLogs(logs) {
        const patterns = this.identifyPatterns(logs);
        const metrics = this.calculateMetrics(logs);
        const recommendations = this.generateRecommendations(patterns, metrics);
        return {
            patterns,
            metrics,
            recommendations
        };
    }
    identifyPatterns(logs) {
        const successful_patterns = [];
        const error_patterns = [];
        const improvement_areas = [];
        // Group logs by success/failure
        const successLogs = logs.filter(log => log.success);
        const errorLogs = logs.filter(log => !log.success);
        // Analyze successful patterns
        const successGroups = this.groupSimilarInteractions(successLogs);
        for (const [context, group] of successGroups) {
            successful_patterns.push({
                type: 'success',
                frequency: group.length / logs.length,
                context: [context],
                examples: group.map(log => log.user_input)
            });
        }
        // Analyze error patterns
        const errorGroups = this.groupSimilarInteractions(errorLogs);
        for (const [context, group] of errorGroups) {
            error_patterns.push({
                type: 'error',
                frequency: group.length / logs.length,
                context: [context],
                examples: group.map(log => log.user_input)
            });
        }
        // Identify improvement areas
        improvement_areas.push(...this.identifyPromptImprovements(logs), ...this.identifyToolImprovements(logs), ...this.identifyContextImprovements(logs));
        return {
            successful_patterns,
            error_patterns,
            improvement_areas
        };
    }
    groupSimilarInteractions(logs) {
        const groups = new Map();
        for (const log of logs) {
            const context = this.getInteractionContext(log);
            if (!groups.has(context)) {
                groups.set(context, []);
            }
            groups.get(context).push(log);
        }
        return groups;
    }
    getInteractionContext(log) {
        // Create a context key based on tools used and general purpose
        const toolsUsed = log.tools_used.map(t => t.name).sort().join(',');
        const purpose = this.classifyPurpose(log.user_input);
        return `${purpose}:${toolsUsed}`;
    }
    classifyPurpose(input) {
        // Simple classification based on keywords
        if (input.includes('login') || input.includes('auth'))
            return 'authentication';
        if (input.includes('click') || input.includes('type'))
            return 'interaction';
        if (input.includes('file') || input.includes('save'))
            return 'file_operation';
        if (input.includes('browser') || input.includes('web'))
            return 'web_automation';
        return 'general';
    }
    calculateMetrics(logs) {
        const totalLogs = logs.length;
        const successfulLogs = logs.filter(log => log.success).length;
        const errorLogs = logs.filter(log => !log.success).length;
        const recoveredErrors = logs.filter(log => log.error?.recovery).length;
        return {
            success_rate: successfulLogs / totalLogs,
            response_time: this.calculateAverageResponseTime(logs),
            error_frequency: errorLogs / totalLogs,
            recovery_rate: recoveredErrors / errorLogs || 0
        };
    }
    calculateAverageResponseTime(logs) {
        if (logs.length === 0)
            return 0;
        const responseTimes = logs.map(log => {
            const start = new Date(log.timestamp).getTime();
            const end = new Date(log.timestamp).getTime() + 1000; // Approximate
            return end - start;
        });
        return responseTimes.reduce((a, b) => a + b, 0) / logs.length;
    }
    generateRecommendations(patterns, metrics) {
        return {
            prompt_improvements: this.generatePromptImprovements(patterns),
            tool_adjustments: this.generateToolAdjustments(patterns),
            context_enhancements: this.generateContextEnhancements(patterns, metrics)
        };
    }
    generatePromptImprovements(patterns) {
        const improvements = [];
        // Analyze error patterns for prompt-related issues
        patterns.error_patterns.forEach(pattern => {
            if (pattern.frequency > 0.1) { // More than 10% occurrence
                improvements.push(`Enhance prompt handling for context: ${pattern.context.join(', ')}`);
            }
        });
        // Learn from successful patterns
        patterns.successful_patterns.forEach(pattern => {
            if (pattern.frequency > 0.2) { // More than 20% occurrence
                improvements.push(`Reinforce successful pattern: ${pattern.context.join(', ')}`);
            }
        });
        return improvements;
    }
    generateToolAdjustments(patterns) {
        const adjustments = [];
        // Analyze tool usage patterns
        patterns.improvement_areas
            .filter(area => area.type === 'tool')
            .forEach(area => {
            adjustments.push(...area.suggestions);
        });
        return adjustments;
    }
    generateContextEnhancements(patterns, metrics) {
        const enhancements = [];
        if (metrics.success_rate < 0.8) {
            enhancements.push('Improve context retention between interactions');
        }
        patterns.improvement_areas
            .filter(area => area.type === 'context')
            .forEach(area => {
            enhancements.push(...area.suggestions);
        });
        return enhancements;
    }
    identifyPromptImprovements(logs) {
        return [{
                type: 'prompt',
                description: 'Prompt clarity and effectiveness',
                impact: 0.8,
                suggestions: [
                    'Add more explicit examples',
                    'Clarify tool capabilities',
                    'Improve error messaging'
                ]
            }];
    }
    identifyToolImprovements(logs) {
        return [{
                type: 'tool',
                description: 'Tool usage optimization',
                impact: 0.7,
                suggestions: [
                    'Add parameter validation',
                    'Improve error recovery',
                    'Enhance tool combinations'
                ]
            }];
    }
    identifyContextImprovements(logs) {
        return [{
                type: 'context',
                description: 'Context management',
                impact: 0.9,
                suggestions: [
                    'Improve state tracking',
                    'Enhance memory usage',
                    'Better context switching'
                ]
            }];
    }
}
//# sourceMappingURL=LearningSystem.js.map