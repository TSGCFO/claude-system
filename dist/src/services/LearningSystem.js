import * as fs from 'fs/promises';
import * as path from 'path';
export class LearningSystem {
    constructor(logger, toolRegistry, config = {}) {
        this.logger = logger;
        this.toolRegistry = toolRegistry;
        this.logDir = path.join(process.cwd(), 'logs');
        this.interactionsDir = path.join(this.logDir, 'interactions');
        this.patternCache = new Map();
        this.cacheTimeout = config.cacheTimeout || 3600000; // 1 hour
        this.lastCacheUpdate = 0;
        this.adaptationThreshold = config.adaptationThreshold || 0.7;
        this.confidenceThreshold = config.confidenceThreshold || 0.8;
        this.learningMetrics = {
            patternRecognitionRate: 0,
            adaptationSpeed: 0,
            confidenceAccuracy: 0,
            contextRelevance: 0
        };
        this.initialize();
    }
    async initialize() {
        try {
            await this.ensureDirectories();
            await this.loadPatternCache();
            await this.initializeLearningMetrics();
            this.logger.info('LearningSystem initialized successfully', {
                metrics: this.learningMetrics,
                adaptationThreshold: this.adaptationThreshold,
                confidenceThreshold: this.confidenceThreshold
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize LearningSystem:', error);
        }
    }
    async initializeLearningMetrics() {
        try {
            const recentLogs = await this.analyzeRecentLogs(24);
            // Calculate pattern recognition rate
            const totalPatterns = recentLogs.patterns.successful_patterns.length +
                recentLogs.patterns.error_patterns.length;
            this.learningMetrics.patternRecognitionRate = totalPatterns > 0 ?
                recentLogs.patterns.successful_patterns.length / totalPatterns : 0;
            // Calculate adaptation speed
            const adaptations = recentLogs.patterns.successful_patterns
                .flatMap(p => p.adaptations || [])
                .filter(a => a.impact > 0);
            this.learningMetrics.adaptationSpeed = adaptations.length > 0 ?
                adaptations.reduce((acc, a) => acc + a.impact, 0) / adaptations.length : 0;
            // Calculate confidence accuracy
            this.learningMetrics.confidenceAccuracy = recentLogs.metrics.confidence_accuracy;
            // Calculate context relevance
            const patterns = recentLogs.patterns.successful_patterns;
            this.learningMetrics.contextRelevance = patterns.length > 0 ?
                patterns.reduce((acc, p) => acc + (p.context_relevance || 0), 0) / patterns.length : 0;
            this.logger.debug('Learning metrics initialized:', this.learningMetrics);
        }
        catch (error) {
            this.logger.error('Failed to initialize learning metrics:', error);
            // Keep default values if initialization fails
        }
    }
    async updateLearningMetrics(interaction) {
        try {
            // Update pattern recognition rate
            if (interaction.success) {
                this.learningMetrics.patternRecognitionRate =
                    (this.learningMetrics.patternRecognitionRate * 0.9) + 0.1;
            }
            else {
                this.learningMetrics.patternRecognitionRate *= 0.9;
            }
            // Update adaptation speed if feedback exists
            if (interaction.feedback) {
                const adaptationImpact = (interaction.feedback.rating - 3) / 2; // -1 to 1
                this.learningMetrics.adaptationSpeed =
                    (this.learningMetrics.adaptationSpeed * 0.9) + (adaptationImpact * 0.1);
            }
            // Update confidence accuracy
            if (interaction.confidence !== undefined) {
                const accuracyDelta = interaction.success ? 0.1 : -0.1;
                this.learningMetrics.confidenceAccuracy =
                    Math.max(0, Math.min(1, this.learningMetrics.confidenceAccuracy + accuracyDelta));
            }
            // Update context relevance
            if (interaction.context) {
                const relevanceDelta = interaction.success ? 0.1 : -0.1;
                this.learningMetrics.contextRelevance =
                    Math.max(0, Math.min(1, this.learningMetrics.contextRelevance + relevanceDelta));
            }
            this.logger.debug('Learning metrics updated:', this.learningMetrics);
        }
        catch (error) {
            this.logger.error('Failed to update learning metrics:', error);
        }
    }
    async ensureDirectories() {
        await fs.mkdir(this.logDir, { recursive: true });
        await fs.mkdir(this.interactionsDir, { recursive: true });
    }
    async loadPatternCache() {
        try {
            // Initialize with empty patterns if no logs exist
            const analysis = await this.analyzeRecentLogs(24).catch(() => ({
                metrics: {
                    success_rate: 1,
                    error_frequency: 0,
                    response_time: 0,
                    recovery_rate: 1
                },
                patterns: {
                    successful_patterns: [],
                    error_patterns: []
                }
            }));
            this.patternCache = new Map();
            analysis.patterns.successful_patterns.forEach(pattern => {
                this.patternCache.set(`success:${pattern.type}`, pattern);
            });
            analysis.patterns.error_patterns.forEach(pattern => {
                this.patternCache.set(`error:${pattern.type}`, pattern);
            });
            this.lastCacheUpdate = Date.now();
        }
        catch (error) {
            this.logger.error('Failed to load pattern cache:', error);
            // Initialize with empty cache
            this.patternCache = new Map();
        }
    }
    async logInteraction(interaction) {
        try {
            const timestamp = new Date().toISOString();
            const log = {
                timestamp,
                ...interaction
            };
            // Store interaction log
            const filename = `${timestamp.replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(this.interactionsDir, filename);
            await fs.writeFile(filepath, JSON.stringify(log, null, 2));
            // Update learning metrics
            await this.updateLearningMetrics(log);
            // Check if pattern adaptation is needed
            if (this.shouldAdaptPatterns(log)) {
                await this.adaptPatterns(log);
            }
            // Update tool effectiveness if tools were used
            if (log.tools_used && log.tools_used.length > 0) {
                await Promise.all(log.tools_used.map(tool => this.updateToolEffectiveness(tool, log.success)));
            }
            this.logger.debug('Interaction processed:', {
                filename,
                metrics: this.learningMetrics,
                success: log.success,
                toolsUsed: log.tools_used?.length || 0
            });
        }
        catch (error) {
            this.logger.error('Failed to process interaction:', error);
        }
    }
    shouldAdaptPatterns(log) {
        return ((log.feedback?.rating || 0) < 3 || // Low user rating
            !log.success || // Failed interaction
            this.learningMetrics.patternRecognitionRate < this.adaptationThreshold || // Poor pattern recognition
            (log.confidence || 0) < this.confidenceThreshold // Low confidence
        );
    }
    async adaptPatterns(log) {
        try {
            const patterns = await this.analyzePatterns([log]);
            const adaptation = {
                timestamp: new Date().toISOString(),
                change: this.determineAdaptation(log, patterns),
                impact: 0, // Will be updated after measuring effectiveness
                context: log.context || ''
            };
            // Update pattern cache with adaptation
            patterns.forEach(pattern => {
                const cached = this.patternCache.get(pattern.type);
                if (cached) {
                    cached.adaptations = [...(cached.adaptations || []), adaptation];
                    this.patternCache.set(pattern.type, cached);
                }
            });
            this.logger.info('Patterns adapted:', {
                patterns: patterns.length,
                adaptation,
                context: log.context
            });
        }
        catch (error) {
            this.logger.error('Failed to adapt patterns:', error);
        }
    }
    determineAdaptation(log, patterns) {
        if (!log.success) {
            return 'Avoid similar pattern in similar context';
        }
        if (log.feedback?.rating === 5) {
            return 'Reinforce pattern for similar context';
        }
        return 'Modify pattern based on feedback';
    }
    async analyzeRecentLogs(hours) {
        try {
            const now = Date.now();
            const timeThreshold = now - (hours * 3600000);
            // Read all log files
            const files = await fs.readdir(this.interactionsDir);
            const logs = [];
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                try {
                    const filepath = path.join(this.interactionsDir, file);
                    const content = await fs.readFile(filepath, 'utf-8');
                    const log = JSON.parse(content);
                    if (new Date(log.timestamp).getTime() > timeThreshold) {
                        logs.push(log);
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to read log file ${file}:`, error);
                }
            }
            // Return default analysis if no logs found
            if (logs.length === 0) {
                return {
                    metrics: {
                        success_rate: 1,
                        error_frequency: 0,
                        response_time: 0,
                        recovery_rate: 1,
                        adaptation_effectiveness: 1,
                        learning_rate: 0,
                        confidence_accuracy: 1
                    },
                    patterns: {
                        successful_patterns: [],
                        error_patterns: [],
                        emerging_patterns: [],
                        deprecated_patterns: []
                    },
                    recommendations: {
                        immediate: [],
                        long_term: [],
                        adaptations: []
                    }
                };
            }
            // Calculate metrics
            const totalLogs = logs.length;
            const successfulLogs = logs.filter(log => log.success).length;
            const errorLogs = logs.filter(log => !log.success).length;
            const averageResponseTime = logs.reduce((acc, log) => acc + log.duration, 0) / totalLogs;
            // Calculate recovery rate
            const recoveredErrors = logs.reduce((acc, log, i) => {
                if (i === 0)
                    return acc;
                const prevLog = logs[i - 1];
                if (!prevLog.success && log.success)
                    acc++;
                return acc;
            }, 0);
            // Analyze patterns
            const successPatterns = this.analyzePatterns(logs.filter(log => log.success));
            const errorPatterns = this.analyzePatterns(logs.filter(log => !log.success));
            // Calculate additional metrics
            const confidenceAccuracy = logs
                .filter(log => log.confidence !== undefined)
                .reduce((acc, log) => acc + (log.success ? 1 : 0), 0) / totalLogs;
            const adaptationEffectiveness = this.calculateAdaptationEffectiveness(logs);
            const learningRate = this.calculateLearningRate(logs);
            // Analyze emerging and deprecated patterns
            const emergingPatterns = this.findEmergingPatterns(logs);
            const deprecatedPatterns = this.findDeprecatedPatterns(logs);
            // Generate recommendations
            const recommendations = this.generateRecommendations(logs, {
                successPatterns,
                errorPatterns,
                emergingPatterns,
                deprecatedPatterns
            });
            return {
                metrics: {
                    success_rate: successfulLogs / totalLogs,
                    error_frequency: errorLogs / totalLogs,
                    response_time: averageResponseTime,
                    recovery_rate: errorLogs > 0 ? recoveredErrors / errorLogs : 1,
                    adaptation_effectiveness: adaptationEffectiveness,
                    learning_rate: learningRate,
                    confidence_accuracy: confidenceAccuracy
                },
                patterns: {
                    successful_patterns: successPatterns,
                    error_patterns: errorPatterns,
                    emerging_patterns: emergingPatterns,
                    deprecated_patterns: deprecatedPatterns
                },
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Failed to analyze logs:', error);
            throw error;
        }
    }
    analyzePatterns(logs) {
        if (!logs || logs.length === 0)
            return [];
        const patterns = new Map();
        logs.forEach(log => {
            if (!log)
                return;
            // Analyze tool usage patterns
            if (log.tools_used && Array.isArray(log.tools_used) && log.tools_used.length > 0) {
                const pattern = log.tools_used.join(',');
                const existing = patterns.get(pattern) || { count: 0, total: 0 };
                patterns.set(pattern, {
                    count: existing.count + 1,
                    total: existing.total + 1
                });
            }
            // Analyze command patterns
            if (log.command) {
                const commandType = this.categorizeCommand(log.command);
                if (commandType) {
                    const existing = patterns.get(commandType) || { count: 0, total: 0 };
                    patterns.set(commandType, {
                        count: existing.count + 1,
                        total: existing.total + 1
                    });
                }
            }
        });
        return Array.from(patterns.entries())
            .map(([type, stats]) => ({
            type,
            frequency: stats.count / logs.length,
            success_rate: stats.count / stats.total
        }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10); // Top 10 patterns
    }
    categorizeCommand(command) {
        if (!command)
            return null;
        const commandLower = command.toLowerCase();
        // File operations
        if (commandLower.includes('file') ||
            commandLower.includes('folder') ||
            commandLower.includes('directory')) {
            return 'file_operation';
        }
        // Web operations
        if (commandLower.includes('browse') ||
            commandLower.includes('web') ||
            commandLower.includes('http') ||
            commandLower.includes('url')) {
            return 'web_operation';
        }
        // System operations
        if (commandLower.includes('system') ||
            commandLower.includes('process') ||
            commandLower.includes('run') ||
            commandLower.includes('execute')) {
            return 'system_operation';
        }
        // Analysis operations
        if (commandLower.includes('analyze') ||
            commandLower.includes('check') ||
            commandLower.includes('verify') ||
            commandLower.includes('test')) {
            return 'analysis_operation';
        }
        return 'other_operation';
    }
    async getRecommendation(context) {
        try {
            if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
                await this.loadPatternCache();
            }
            const recommendations = [];
            const contextType = this.categorizeCommand(context);
            if (contextType) {
                // Find successful patterns for similar contexts
                const successPattern = this.patternCache.get(`success:${contextType}`);
                if (successPattern) {
                    recommendations.push(`Consider using pattern: ${successPattern.type}`);
                }
                // Find error patterns to avoid
                const errorPattern = this.patternCache.get(`error:${contextType}`);
                if (errorPattern) {
                    recommendations.push(`Avoid pattern: ${errorPattern.type}`);
                }
            }
            return recommendations;
        }
        catch (error) {
            this.logger.error('Failed to get recommendations:', error);
            return [];
        }
    }
    async updateToolEffectiveness(toolName, success) {
        try {
            const tool = this.toolRegistry.getTool(toolName);
            if (!tool)
                return;
            const analysisPath = path.join(this.logDir, 'analysis', 'tool_effectiveness.json');
            let effectiveness = {};
            try {
                const content = await fs.readFile(analysisPath, 'utf-8');
                effectiveness = JSON.parse(content);
            }
            catch {
                // File doesn't exist yet
            }
            const stats = effectiveness[toolName] || { success: 0, total: 0 };
            stats.total++;
            if (success)
                stats.success++;
            effectiveness[toolName] = stats;
            await fs.mkdir(path.dirname(analysisPath), { recursive: true });
            await fs.writeFile(analysisPath, JSON.stringify(effectiveness, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to update tool effectiveness:', error);
        }
    }
    calculateAdaptationEffectiveness(logs) {
        const adaptedLogs = logs.filter(log => log.feedback && log.feedback.rating > 3);
        if (adaptedLogs.length === 0)
            return 1;
        return adaptedLogs.length / logs.length;
    }
    calculateLearningRate(logs) {
        if (logs.length < 2)
            return 0;
        let improvements = 0;
        for (let i = 1; i < logs.length; i++) {
            const current = logs[i];
            const previous = logs[i - 1];
            if (current.success && !previous.success) {
                improvements++;
            }
            if (current.feedback && previous.feedback &&
                current.feedback.rating > previous.feedback.rating) {
                improvements++;
            }
        }
        return improvements / (logs.length - 1);
    }
    findEmergingPatterns(logs) {
        const recentLogs = logs.slice(-Math.min(logs.length, 10)); // Last 10 interactions
        const patterns = this.analyzePatterns(recentLogs);
        return patterns.filter(pattern => {
            const existingPattern = this.patternCache.get(`success:${pattern.type}`);
            return !existingPattern || pattern.frequency > (existingPattern.frequency * 1.5);
        });
    }
    findDeprecatedPatterns(logs) {
        const recentLogs = logs.slice(-Math.min(logs.length, 20)); // Last 20 interactions
        const recentPatterns = this.analyzePatterns(recentLogs);
        return Array.from(this.patternCache.values())
            .filter(pattern => {
            const recentPattern = recentPatterns.find(p => p.type === pattern.type);
            return !recentPattern || recentPattern.frequency < (pattern.frequency * 0.5);
        });
    }
    generateRecommendations(logs, patterns) {
        const recommendations = {
            immediate: [],
            long_term: [],
            adaptations: []
        };
        // Immediate recommendations based on recent success patterns
        patterns.successPatterns.forEach(pattern => {
            recommendations.immediate.push(`Use pattern "${pattern.type}" for similar contexts (${Math.round(pattern.success_rate * 100)}% success rate)`);
        });
        // Long-term recommendations based on emerging patterns
        patterns.emergingPatterns.forEach(pattern => {
            recommendations.long_term.push(`Consider adopting emerging pattern "${pattern.type}" (${Math.round(pattern.frequency * 100)}% frequency)`);
        });
        // Adaptation recommendations
        patterns.deprecatedPatterns.forEach(pattern => {
            recommendations.adaptations.push(`Phase out pattern "${pattern.type}" in favor of newer alternatives`);
        });
        return recommendations;
    }
}
//# sourceMappingURL=LearningSystem.js.map