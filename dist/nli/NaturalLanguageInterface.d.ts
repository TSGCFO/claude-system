import { NLIRequest, NLIResponse, OperationType } from '../types/core.js';
interface CommandPattern {
    pattern: RegExp;
    operationType: OperationType;
    extractParams: (matches: RegExpMatchArray) => Record<string, unknown>;
}
export declare class NaturalLanguageInterface {
    private commandPatterns;
    private logger;
    constructor();
    private initializeCommandPatterns;
    /**
     * Process natural language input and convert to operation
     */
    processInput(request: NLIRequest): Promise<NLIResponse>;
    /**
     * Find matching command patterns
     */
    private findCommandMatches;
    /**
     * Create operation from pattern match
     */
    private createOperation;
    /**
     * Calculate confidence score for match
     */
    private calculateConfidence;
    /**
     * Add custom command pattern
     */
    addCommandPattern(pattern: CommandPattern): void;
}
export {};
