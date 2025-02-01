import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
import * as fs from 'fs/promises';
import * as path from 'path';

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

export class LearningSystem {
  private logger: Logger;
  private toolRegistry: ToolRegistry;
  private logsDir: string;
  private analysisDir: string;

  constructor(logger: Logger, toolRegistry: ToolRegistry) {
    this.logger = logger;
    this.toolRegistry = toolRegistry;
    this.logsDir = path.join(process.cwd(), 'logs', 'interactions');
    this.analysisDir = path.join(process.cwd(), 'logs', 'analysis');
    this.initializeDirs();
  }

  private async initializeDirs(): Promise<void> {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      await fs.mkdir(this.analysisDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to initialize log directories', error);
    }
  }

  async logInteraction(interaction: Omit<InteractionLog, 'timestamp'>): Promise<void> {
    try {
      const log: InteractionLog = {
        ...interaction,
        timestamp: new Date()
      };

      const filename = `${log.timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
      await fs.writeFile(
        path.join(this.logsDir, filename),
        JSON.stringify(log, null, 2)
      );

      this.logger.debug('Logged interaction', { filename });
    } catch (error) {
      this.logger.error('Failed to log interaction', error);
    }
  }

  async analyzeRecentLogs(hours: number = 24): Promise<LogAnalysis> {
    try {
      const logs = await this.getRecentLogs(hours);
      return this.analyzeLogs(logs);
    } catch (error) {
      this.logger.error('Failed to analyze logs', error);
      throw error;
    }
  }

  private async getRecentLogs(hours: number): Promise<InteractionLog[]> {
    const files = await fs.readdir(this.logsDir);
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const logs: InteractionLog[] = [];
    for (const file of files) {
      const content = await fs.readFile(path.join(this.logsDir, file), 'utf-8');
      const log: InteractionLog = JSON.parse(content);
      if (new Date(log.timestamp) >= cutoff) {
        logs.push(log);
      }
    }

    return logs;
  }

  private analyzeLogs(logs: InteractionLog[]): LogAnalysis {
    const patterns = this.identifyPatterns(logs);
    const metrics = this.calculateMetrics(logs);
    const recommendations = this.generateRecommendations(patterns, metrics);

    return {
      patterns,
      metrics,
      recommendations
    };
  }

  private identifyPatterns(logs: InteractionLog[]): LogAnalysis['patterns'] {
    const successful_patterns: Pattern[] = [];
    const error_patterns: Pattern[] = [];
    const improvement_areas: Area[] = [];

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
    improvement_areas.push(
      ...this.identifyPromptImprovements(logs),
      ...this.identifyToolImprovements(logs),
      ...this.identifyContextImprovements(logs)
    );

    return {
      successful_patterns,
      error_patterns,
      improvement_areas
    };
  }

  private groupSimilarInteractions(logs: InteractionLog[]): Map<string, InteractionLog[]> {
    const groups = new Map<string, InteractionLog[]>();
    
    for (const log of logs) {
      const context = this.getInteractionContext(log);
      if (!groups.has(context)) {
        groups.set(context, []);
      }
      groups.get(context)!.push(log);
    }

    return groups;
  }

  private getInteractionContext(log: InteractionLog): string {
    // Create a context key based on tools used and general purpose
    const toolsUsed = log.tools_used.map(t => t.name).sort().join(',');
    const purpose = this.classifyPurpose(log.user_input);
    return `${purpose}:${toolsUsed}`;
  }

  private classifyPurpose(input: string): string {
    // Simple classification based on keywords
    if (input.includes('login') || input.includes('auth')) return 'authentication';
    if (input.includes('click') || input.includes('type')) return 'interaction';
    if (input.includes('file') || input.includes('save')) return 'file_operation';
    if (input.includes('browser') || input.includes('web')) return 'web_automation';
    return 'general';
  }

  private calculateMetrics(logs: InteractionLog[]): LogAnalysis['metrics'] {
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

  private calculateAverageResponseTime(logs: InteractionLog[]): number {
    if (logs.length === 0) return 0;
    
    const responseTimes = logs.map(log => {
      const start = new Date(log.timestamp).getTime();
      const end = new Date(log.timestamp).getTime() + 1000; // Approximate
      return end - start;
    });

    return responseTimes.reduce((a, b) => a + b, 0) / logs.length;
  }

  private generateRecommendations(
    patterns: LogAnalysis['patterns'],
    metrics: LogAnalysis['metrics']
  ): LogAnalysis['recommendations'] {
    return {
      prompt_improvements: this.generatePromptImprovements(patterns),
      tool_adjustments: this.generateToolAdjustments(patterns),
      context_enhancements: this.generateContextEnhancements(patterns, metrics)
    };
  }

  private generatePromptImprovements(patterns: LogAnalysis['patterns']): string[] {
    const improvements: string[] = [];

    // Analyze error patterns for prompt-related issues
    patterns.error_patterns.forEach(pattern => {
      if (pattern.frequency > 0.1) { // More than 10% occurrence
        improvements.push(
          `Enhance prompt handling for context: ${pattern.context.join(', ')}`
        );
      }
    });

    // Learn from successful patterns
    patterns.successful_patterns.forEach(pattern => {
      if (pattern.frequency > 0.2) { // More than 20% occurrence
        improvements.push(
          `Reinforce successful pattern: ${pattern.context.join(', ')}`
        );
      }
    });

    return improvements;
  }

  private generateToolAdjustments(patterns: LogAnalysis['patterns']): string[] {
    const adjustments: string[] = [];

    // Analyze tool usage patterns
    patterns.improvement_areas
      .filter(area => area.type === 'tool')
      .forEach(area => {
        adjustments.push(...area.suggestions);
      });

    return adjustments;
  }

  private generateContextEnhancements(
    patterns: LogAnalysis['patterns'],
    metrics: LogAnalysis['metrics']
  ): string[] {
    const enhancements: string[] = [];

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

  private identifyPromptImprovements(logs: InteractionLog[]): Area[] {
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

  private identifyToolImprovements(logs: InteractionLog[]): Area[] {
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

  private identifyContextImprovements(logs: InteractionLog[]): Area[] {
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