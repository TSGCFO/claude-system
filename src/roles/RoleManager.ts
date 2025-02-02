import { Logger } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Role {
  name: string;
  expertise: string[];
  capabilities: string[];
  constraints: RoleConstraints;
  adaptations?: RoleAdaptation[];
}

interface RoleConstraints {
  maxComplexity: number;
  allowedTools: string[];
  responseFormat: string[];
  contextRestrictions?: string[];
}

interface RoleAdaptation {
  timestamp: string;
  trigger: string;
  changes: {
    expertise?: string[];
    capabilities?: string[];
    constraints?: Partial<RoleConstraints>;
  };
  effectiveness: number;
}

interface RoleContext {
  taskType: string;
  complexity: number;
  requiredExpertise: string[];
  toolRequirements: string[];
  userPreferences?: {
    responseFormat?: string[];
    expertiseLevel?: 'basic' | 'intermediate' | 'advanced';
  };
}

interface RoleMetrics {
  successRate: number;
  adaptationEffectiveness: number;
  expertiseUtilization: number;
  contextRelevance: number;
}

export class RoleManager {
  private readonly logger: Logger;
  private readonly rolesDir: string;
  private roles: Map<string, Role>;
  private readonly metricsHistory: Map<string, RoleMetrics[]>;
  private readonly adaptationThreshold: number;
  private readonly maxAdaptations: number;

  constructor(
    logger: Logger,
    config: {
      rolesDir?: string;
      adaptationThreshold?: number;
      maxAdaptations?: number;
    } = {}
  ) {
    this.logger = logger;
    this.rolesDir = config.rolesDir || path.join(process.cwd(), 'config', 'roles');
    this.roles = new Map();
    this.metricsHistory = new Map();
    this.adaptationThreshold = config.adaptationThreshold || 0.7;
    this.maxAdaptations = config.maxAdaptations || 10;

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.rolesDir, { recursive: true });
      await this.loadRoles();
      this.logger.info('RoleManager initialized successfully', {
        rolesCount: this.roles.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize RoleManager:', error);
    }
  }

  private async loadRoles(): Promise<void> {
    try {
      const files = await fs.readdir(this.rolesDir);
      const roleFiles = files.filter(f => f.endsWith('.json'));

      for (const file of roleFiles) {
        const content = await fs.readFile(
          path.join(this.rolesDir, file),
          'utf-8'
        );
        const role: Role = JSON.parse(content);
        this.roles.set(role.name, role);
        this.metricsHistory.set(role.name, []);
      }

      // Create default roles if none exist
      if (this.roles.size === 0) {
        await this.createDefaultRoles();
      }
    } catch (error) {
      this.logger.error('Failed to load roles:', error);
    }
  }

  private async createDefaultRoles(): Promise<void> {
    const defaultRoles: Role[] = [
      {
        name: 'general',
        expertise: ['general-purpose', 'basic-tasks'],
        capabilities: ['basic-tools', 'simple-responses'],
        constraints: {
          maxComplexity: 5,
          allowedTools: ['basic'],
          responseFormat: ['text', 'simple-json']
        }
      },
      {
        name: 'technical',
        expertise: ['software-development', 'system-architecture'],
        capabilities: ['code-analysis', 'technical-writing'],
        constraints: {
          maxComplexity: 8,
          allowedTools: ['all'],
          responseFormat: ['text', 'code', 'json']
        }
      }
    ];

    for (const role of defaultRoles) {
      await this.saveRole(role);
      this.roles.set(role.name, role);
      this.metricsHistory.set(role.name, []);
    }
  }

  private async saveRole(role: Role): Promise<void> {
    try {
      const filePath = path.join(this.rolesDir, `${role.name}.json`);
      await fs.writeFile(filePath, JSON.stringify(role, null, 2));
    } catch (error) {
      this.logger.error('Failed to save role:', error);
    }
  }

  public async selectRole(context: RoleContext): Promise<Role> {
    try {
      const candidates = Array.from(this.roles.values())
        .filter(role => this.isRoleSuitable(role, context));

      if (candidates.length === 0) {
        const adaptedRole = await this.createAdaptedRole(context);
        return adaptedRole;
      }

      return this.findBestRole(candidates, context);
    } catch (error) {
      this.logger.error('Failed to select role:', error);
      return this.roles.get('general')!;
    }
  }

  private isRoleSuitable(role: Role, context: RoleContext): boolean {
    // Check complexity constraints
    if (context.complexity > role.constraints.maxComplexity) {
      return false;
    }

    // Check expertise match
    const hasRequiredExpertise = context.requiredExpertise.every(
      exp => role.expertise.includes(exp)
    );
    if (!hasRequiredExpertise) {
      return false;
    }

    // Check tool requirements
    const hasRequiredTools = context.toolRequirements.every(
      tool => role.constraints.allowedTools.includes(tool) ||
             role.constraints.allowedTools.includes('all')
    );
    if (!hasRequiredTools) {
      return false;
    }

    return true;
  }

  private async createAdaptedRole(context: RoleContext): Promise<Role> {
    const baseRole = this.findClosestRole(context);
    const adaptation: RoleAdaptation = {
      timestamp: new Date().toISOString(),
      trigger: 'no_suitable_role',
      changes: {
        expertise: [...baseRole.expertise, ...context.requiredExpertise],
        capabilities: [...baseRole.capabilities],
        constraints: {
          maxComplexity: Math.max(baseRole.constraints.maxComplexity, context.complexity),
          allowedTools: [...new Set([...baseRole.constraints.allowedTools, ...context.toolRequirements])],
          responseFormat: baseRole.constraints.responseFormat
        }
      },
      effectiveness: 0 // Will be updated based on performance
    };

    const adaptedRole: Role = {
      name: `${baseRole.name}-adapted-${Date.now()}`,
      expertise: adaptation.changes.expertise!,
      capabilities: adaptation.changes.capabilities!,
      constraints: {
        ...baseRole.constraints,
        ...adaptation.changes.constraints
      },
      adaptations: [...(baseRole.adaptations || []), adaptation]
    };

    await this.saveRole(adaptedRole);
    this.roles.set(adaptedRole.name, adaptedRole);
    this.metricsHistory.set(adaptedRole.name, []);

    return adaptedRole;
  }

  private findClosestRole(context: RoleContext): Role {
    const roles = Array.from(this.roles.values());
    return roles.reduce((best, current) => {
      const bestScore = this.calculateRoleScore(best, context);
      const currentScore = this.calculateRoleScore(current, context);
      return currentScore > bestScore ? current : best;
    }, roles[0]);
  }

  private calculateRoleScore(role: Role, context: RoleContext): number {
    let score = 0;

    // Expertise match
    const expertiseMatch = context.requiredExpertise.filter(
      exp => role.expertise.includes(exp)
    ).length;
    score += expertiseMatch / context.requiredExpertise.length;

    // Tool match
    const toolMatch = context.toolRequirements.filter(
      tool => role.constraints.allowedTools.includes(tool) ||
             role.constraints.allowedTools.includes('all')
    ).length;
    score += toolMatch / context.toolRequirements.length;

    // Complexity match
    score += 1 - Math.abs(context.complexity - role.constraints.maxComplexity) / 10;

    // Historical performance
    const metrics = this.metricsHistory.get(role.name);
    if (metrics && metrics.length > 0) {
      const recentMetrics = metrics[metrics.length - 1];
      score += recentMetrics.successRate;
    }

    return score / 4; // Normalize to 0-1
  }

  private findBestRole(candidates: Role[], context: RoleContext): Role {
    return candidates.reduce((best, current) => {
      const bestScore = this.calculateRoleScore(best, context);
      const currentScore = this.calculateRoleScore(current, context);
      return currentScore > bestScore ? current : best;
    });
  }

  public async updateRoleMetrics(
    roleName: string,
    metrics: RoleMetrics
  ): Promise<void> {
    try {
      const history = this.metricsHistory.get(roleName) || [];
      history.push(metrics);

      // Keep only recent history
      if (history.length > this.maxAdaptations) {
        history.shift();
      }

      this.metricsHistory.set(roleName, history);

      // Check if adaptation is needed
      if (await this.shouldAdaptRole(roleName, history)) {
        await this.adaptRole(roleName, history);
      }
    } catch (error) {
      this.logger.error('Failed to update role metrics:', error);
    }
  }

  private async shouldAdaptRole(
    roleName: string,
    history: RoleMetrics[]
  ): Promise<boolean> {
    if (history.length < 2) return false;

    const recent = history.slice(-3);
    const avgSuccess = recent.reduce((acc, m) => acc + m.successRate, 0) / recent.length;
    const avgEffectiveness = recent.reduce((acc, m) => acc + m.adaptationEffectiveness, 0) / recent.length;

    return avgSuccess < this.adaptationThreshold || avgEffectiveness < this.adaptationThreshold;
  }

  private async adaptRole(
    roleName: string,
    history: RoleMetrics[]
  ): Promise<void> {
    try {
      const role = this.roles.get(roleName);
      if (!role) return;

      const adaptation: RoleAdaptation = {
        timestamp: new Date().toISOString(),
        trigger: 'performance_threshold',
        changes: await this.determineAdaptationChanges(role, history),
        effectiveness: 0
      };

      const adaptedRole: Role = {
        ...role,
        expertise: [...role.expertise, ...(adaptation.changes.expertise || [])],
        capabilities: [...role.capabilities, ...(adaptation.changes.capabilities || [])],
        constraints: {
          ...role.constraints,
          ...adaptation.changes.constraints
        },
        adaptations: [...(role.adaptations || []), adaptation]
      };

      await this.saveRole(adaptedRole);
      this.roles.set(roleName, adaptedRole);
    } catch (error) {
      this.logger.error('Failed to adapt role:', error);
    }
  }

  private async determineAdaptationChanges(
    role: Role,
    history: RoleMetrics[]
  ): Promise<RoleAdaptation['changes']> {
    const changes: RoleAdaptation['changes'] = {};

    // Analyze performance patterns
    const recentMetrics = history.slice(-3);
    const avgExpertiseUtilization = recentMetrics.reduce(
      (acc, m) => acc + m.expertiseUtilization, 0
    ) / recentMetrics.length;

    // Adjust expertise if underutilized
    if (avgExpertiseUtilization < this.adaptationThreshold) {
      changes.expertise = this.suggestExpertiseChanges(role);
    }

    // Adjust constraints based on context relevance
    const avgContextRelevance = recentMetrics.reduce(
      (acc, m) => acc + m.contextRelevance, 0
    ) / recentMetrics.length;

    if (avgContextRelevance < this.adaptationThreshold) {
      changes.constraints = this.suggestConstraintChanges(role);
    }

    return changes;
  }

  private suggestExpertiseChanges(role: Role): string[] {
    // Implement expertise suggestion logic
    return [];
  }

  private suggestConstraintChanges(role: Role): Partial<RoleConstraints> {
    // Implement constraint suggestion logic
    return {};
  }
}