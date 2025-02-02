import { Logger } from 'winston';
import { ToolRegistry } from '../tools/Tool.js';
interface PromptTemplate {
    name: string;
    template: string;
    variables: string[];
    description: string;
}
export declare class PromptManager {
    private logger;
    private toolRegistry;
    private templates;
    private systemPrompt;
    constructor(logger: Logger, toolRegistry: ToolRegistry);
    private initialize;
    private loadSystemPrompt;
    private loadTemplates;
    private parseTemplate;
    private loadDefaultTemplates;
    private getDefaultSystemPrompt;
    getSystemPrompt(): string;
    getTemplate(name: string): PromptTemplate | undefined;
    fillTemplate(name: string, variables: Record<string, string>): string;
    listTemplates(): PromptTemplate[];
}
export {};
