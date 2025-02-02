import * as fs from 'fs/promises';
import * as path from 'path';
export class PromptManager {
    constructor(logger, toolRegistry) {
        this.logger = logger;
        this.toolRegistry = toolRegistry;
        this.templates = new Map();
        this.systemPrompt = '';
        this.initialize();
    }
    async initialize() {
        try {
            // Load system prompt
            this.systemPrompt = await this.loadSystemPrompt();
            // Load templates
            await this.loadTemplates();
            this.logger.info('PromptManager initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize PromptManager:', error);
        }
    }
    async loadSystemPrompt() {
        try {
            const defaultPromptPath = path.join(process.cwd(), 'src', 'prompts', 'default-system-prompt.md');
            const systemPromptPath = path.join(process.cwd(), 'external', 'courses', 'prompting', 'system-prompt.md');
            try {
                return await fs.readFile(systemPromptPath, 'utf-8');
            }
            catch {
                return await fs.readFile(defaultPromptPath, 'utf-8');
            }
        }
        catch (error) {
            this.logger.error('Failed to load system prompt:', error);
            return this.getDefaultSystemPrompt();
        }
    }
    async loadTemplates() {
        try {
            // Load default templates first
            this.loadDefaultTemplates();
            // Try to load templates from external courses
            const templatesDir = path.join(process.cwd(), 'src', 'prompts', 'templates');
            const files = await fs.readdir(templatesDir);
            for (const file of files) {
                if (file.endsWith('.md')) {
                    try {
                        const templatePath = path.join(templatesDir, file);
                        const content = await fs.readFile(templatePath, 'utf-8');
                        const template = this.parseTemplate(content, file);
                        this.templates.set(template.name, template);
                    }
                    catch (error) {
                        this.logger.error(`Failed to load template ${file}:`, error);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to load templates:', error);
        }
    }
    parseTemplate(content, filename) {
        const lines = content.split('\n');
        const name = filename.replace('.md', '');
        const variables = [];
        const templateLines = [];
        let description = '';
        let inDescription = false;
        for (const line of lines) {
            if (line.startsWith('Description:')) {
                inDescription = true;
                continue;
            }
            if (inDescription && line.trim() === '') {
                inDescription = false;
                continue;
            }
            if (inDescription) {
                description += line.trim() + ' ';
            }
            else {
                templateLines.push(line);
                // Extract variables in {{variable}} format
                const matches = line.match(/\{\{([^}]+)\}\}/g);
                if (matches) {
                    variables.push(...matches.map(m => m.slice(2, -2)));
                }
            }
        }
        return {
            name,
            template: templateLines.join('\n'),
            variables: [...new Set(variables)],
            description: description.trim()
        };
    }
    loadDefaultTemplates() {
        const defaultTemplates = [
            {
                name: 'task-analysis',
                template: `Analyze the following task:
{{task}}

Available Tools:
{{tools}}

<inner_monologue>
1. Task Analysis:
   - Primary objective:
   - Required capabilities:
   - Dependencies:
   - Constraints:

2. Required Steps:
   - Step 1:
   - Step 2:
   - Step 3:

3. Potential Challenges:
   - Challenge 1:
   - Challenge 2:
   - Challenge 3:

4. Success Criteria:
   - Primary goals:
   - Validation steps:
   - Quality checks:
</inner_monologue>`,
                variables: ['task', 'tools'],
                description: 'Template for analyzing and breaking down complex tasks'
            },
            {
                name: 'error-handling',
                template: `An error occurred during the following operation:
{{operation}}

Error details:
{{error}}

<error_analysis>
1. Error Classification:
   - Type:
   - Severity:
   - Impact:
   - Scope:

2. Root Cause Analysis:
   - Immediate cause:
   - Contributing factors:
   - System state:
   - Environmental factors:

3. Recovery Options:
   - Immediate actions:
   - Alternative approaches:
   - Rollback steps:
   - Validation methods:
</error_analysis>`,
                variables: ['operation', 'error'],
                description: 'Template for handling and recovering from errors'
            }
        ];
        for (const template of defaultTemplates) {
            this.templates.set(template.name, template);
        }
    }
    getDefaultSystemPrompt() {
        return `You are an AI assistant with the ability to control a computer system through various tools.
Your primary function is to help users accomplish tasks by:
1. Understanding their requirements
2. Breaking down complex tasks
3. Using appropriate tools
4. Handling errors gracefully
5. Providing clear feedback

Available tools:
{{tools}}

Always maintain a clear understanding of the context and previous actions.
Prioritize safety and security in all operations.
Provide clear explanations of your actions and any errors encountered.`;
    }
    getSystemPrompt() {
        const tools = this.toolRegistry.getAllToolMetadata();
        const toolDescriptions = tools.map(tool => {
            const params = Object.entries(tool.parameters)
                .map(([name, param]) => `  - ${name} (${param.type}${param.required ? ', required' : ''}): ${param.description}`)
                .join('\n');
            return `${tool.name}:\n${tool.description}\nParameters:\n${params}`;
        }).join('\n\n');
        return this.systemPrompt.replace('{{tools}}', toolDescriptions);
    }
    getTemplate(name) {
        return this.templates.get(name);
    }
    fillTemplate(name, variables) {
        const template = this.templates.get(name);
        if (!template) {
            throw new Error(`Template '${name}' not found`);
        }
        let result = template.template;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        return result;
    }
    listTemplates() {
        return Array.from(this.templates.values());
    }
}
//# sourceMappingURL=PromptManager.js.map