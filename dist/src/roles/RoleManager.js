import * as fs from 'fs/promises';
import * as path from 'path';
export class RoleManager {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.rolesDir = config.rolesDir || path.join(process.cwd(), 'config', 'roles');
        this.roles = new Map();
        this.metricsHistory = new Map();
        this.adaptationThreshold = config.adaptationThreshold || 0.7;
        this.maxAdaptations = config.maxAdaptations || 10;
        this.initialize();
    }
    async initialize() {
        try {
            await fs.mkdir(this.rolesDir, { recursive: true });
            await this.loadRoles();
            this.logger.info('RoleManager initialized successfully', {
                rolesCount: this.roles.size
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize RoleManager:', error);
        }
    }
    async loadRoles() {
        try {
            const files = await fs.readdir(this.rolesDir);
            const roleFiles = files.filter(f => f.endsWith('.json'));
            for (const file of roleFiles) {
                const content = await fs.readFile(path.join(this.rolesDir, file), 'utf-8');
                const role = JSON.parse(content);
                this.roles.set(role.name, role);
                this.metricsHistory.set(role.name, []);
            }
            // Create default roles if none exist
            if (this.roles.size === 0) {
                await this.createDefaultRoles();
            }
        }
        catch (error) {
            this.logger.error('Failed to load roles:', error);
        }
    }
    async createDefaultRoles() {
        const defaultRoles = [
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
    async saveRole(role) {
        try {
            const filePath = path.join(this.rolesDir, `${role.name}.json`);
            await fs.writeFile(filePath, JSON.stringify(role, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save role:', error);
        }
    }
    async selectRole(context) {
        try {
            const candidates = Array.from(this.roles.values())
                .filter(role => this.isRoleSuitable(role, context));
            if (candidates.length === 0) {
                const adaptedRole = await this.createAdaptedRole(context);
                return adaptedRole;
            }
            return this.findBestRole(candidates, context);
        }
        catch (error) {
            this.logger.error('Failed to select role:', error);
            return this.roles.get('general');
        }
    }
    isRoleSuitable(role, context) {
        // Check complexity constraints
        if (context.complexity > role.constraints.maxComplexity) {
            return false;
        }
        // Check expertise match
        const hasRequiredExpertise = context.requiredExpertise.every(exp => role.expertise.includes(exp));
        if (!hasRequiredExpertise) {
            return false;
        }
        // Check tool requirements
        const hasRequiredTools = context.toolRequirements.every(tool => role.constraints.allowedTools.includes(tool) ||
            role.constraints.allowedTools.includes('all'));
        if (!hasRequiredTools) {
            return false;
        }
        return true;
    }
    async createAdaptedRole(context) {
        const baseRole = this.findClosestRole(context);
        const adaptation = {
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
        const adaptedRole = {
            name: `${baseRole.name}-adapted-${Date.now()}`,
            expertise: adaptation.changes.expertise,
            capabilities: adaptation.changes.capabilities,
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
    findClosestRole(context) {
        const roles = Array.from(this.roles.values());
        return roles.reduce((best, current) => {
            const bestScore = this.calculateRoleScore(best, context);
            const currentScore = this.calculateRoleScore(current, context);
            return currentScore > bestScore ? current : best;
        }, roles[0]);
    }
    calculateRoleScore(role, context) {
        let score = 0;
        // Expertise match
        const expertiseMatch = context.requiredExpertise.filter(exp => role.expertise.includes(exp)).length;
        score += expertiseMatch / context.requiredExpertise.length;
        // Tool match
        const toolMatch = context.toolRequirements.filter(tool => role.constraints.allowedTools.includes(tool) ||
            role.constraints.allowedTools.includes('all')).length;
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
    findBestRole(candidates, context) {
        return candidates.reduce((best, current) => {
            const bestScore = this.calculateRoleScore(best, context);
            const currentScore = this.calculateRoleScore(current, context);
            return currentScore > bestScore ? current : best;
        });
    }
    async updateRoleMetrics(roleName, metrics) {
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
        }
        catch (error) {
            this.logger.error('Failed to update role metrics:', error);
        }
    }
    async shouldAdaptRole(roleName, history) {
        if (history.length < 2)
            return false;
        const recent = history.slice(-3);
        const avgSuccess = recent.reduce((acc, m) => acc + m.successRate, 0) / recent.length;
        const avgEffectiveness = recent.reduce((acc, m) => acc + m.adaptationEffectiveness, 0) / recent.length;
        return avgSuccess < this.adaptationThreshold || avgEffectiveness < this.adaptationThreshold;
    }
    async adaptRole(roleName, history) {
        try {
            const role = this.roles.get(roleName);
            if (!role)
                return;
            const adaptation = {
                timestamp: new Date().toISOString(),
                trigger: 'performance_threshold',
                changes: await this.determineAdaptationChanges(role, history),
                effectiveness: 0
            };
            const adaptedRole = {
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
        }
        catch (error) {
            this.logger.error('Failed to adapt role:', error);
        }
    }
    async determineAdaptationChanges(role, history) {
        const changes = {};
        // Analyze performance patterns
        const recentMetrics = history.slice(-3);
        const avgExpertiseUtilization = recentMetrics.reduce((acc, m) => acc + m.expertiseUtilization, 0) / recentMetrics.length;
        // Adjust expertise if underutilized
        if (avgExpertiseUtilization < this.adaptationThreshold) {
            changes.expertise = this.suggestExpertiseChanges(role);
        }
        // Adjust constraints based on context relevance
        const avgContextRelevance = recentMetrics.reduce((acc, m) => acc + m.contextRelevance, 0) / recentMetrics.length;
        if (avgContextRelevance < this.adaptationThreshold) {
            changes.constraints = this.suggestConstraintChanges(role);
        }
        return changes;
    }
    suggestExpertiseChanges(role) {
        // Implement expertise suggestion logic
        return [];
    }
    suggestConstraintChanges(role) {
        // Implement constraint suggestion logic
        return {};
    }
}
//# sourceMappingURL=RoleManager.js.map