import { Logger } from 'winston';
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
export declare class RoleManager {
    private readonly logger;
    private readonly rolesDir;
    private roles;
    private readonly metricsHistory;
    private readonly adaptationThreshold;
    private readonly maxAdaptations;
    constructor(logger: Logger, config?: {
        rolesDir?: string;
        adaptationThreshold?: number;
        maxAdaptations?: number;
    });
    private initialize;
    private loadRoles;
    private createDefaultRoles;
    private saveRole;
    selectRole(context: RoleContext): Promise<Role>;
    private isRoleSuitable;
    private createAdaptedRole;
    private findClosestRole;
    private calculateRoleScore;
    private findBestRole;
    updateRoleMetrics(roleName: string, metrics: RoleMetrics): Promise<void>;
    private shouldAdaptRole;
    private adaptRole;
    private determineAdaptationChanges;
    private suggestExpertiseChanges;
    private suggestConstraintChanges;
}
export {};
