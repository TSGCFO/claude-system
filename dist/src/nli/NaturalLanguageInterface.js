import { randomUUID } from 'node:crypto';
import { createLogger, format, transports } from 'winston';
export class NaturalLanguageInterface {
    constructor() {
        this.commandPatterns = this.initializeCommandPatterns();
        this.logger = createLogger({
            level: 'debug',
            format: format.combine(format.timestamp(), format.json()),
            transports: [
                new transports.Console(),
                new transports.File({ filename: 'logs/nli.log' })
            ]
        });
    }
    initializeCommandPatterns() {
        return [
            // File operations
            {
                pattern: /(?:open|read|show) (?:the )?file (.+)/i,
                operationType: 'FILE_OPERATION',
                extractParams: (matches) => ({
                    action: 'READ',
                    path: matches[1].trim()
                })
            },
            {
                pattern: /(?:create|write) (?:a )?file (.+?) with content (.+)/i,
                operationType: 'FILE_OPERATION',
                extractParams: (matches) => ({
                    action: 'WRITE',
                    path: matches[1].trim(),
                    content: matches[2].trim()
                })
            },
            {
                pattern: /(?:delete|remove) (?:the )?file (.+)/i,
                operationType: 'FILE_OPERATION',
                extractParams: (matches) => ({
                    action: 'DELETE',
                    path: matches[1].trim()
                })
            },
            // Web navigation
            {
                pattern: /(?:go to|open|navigate to) (?:the )?(?:website |url )?(?:https?:\/\/)?([^\s]+)/i,
                operationType: 'WEB_NAVIGATION',
                extractParams: (matches) => ({
                    action: 'NAVIGATE',
                    url: matches[1].startsWith('http') ? matches[1] : `https://${matches[1]}`
                })
            },
            {
                pattern: /click (?:on )?(?:the )?(.+?)(?: at )?(\d+)?,?(\d+)?/i,
                operationType: 'WEB_NAVIGATION',
                extractParams: (matches) => ({
                    action: 'CLICK',
                    selector: matches[1].trim(),
                    coordinates: matches[2] && matches[3] ? { x: parseInt(matches[2]), y: parseInt(matches[3]) } : undefined
                })
            },
            // App control
            {
                pattern: /(?:open|launch|start) (?:the )?(?:app |application )?([^(website|url)].+)/i,
                operationType: 'APP_CONTROL',
                extractParams: (matches) => ({
                    action: 'LAUNCH',
                    appName: matches[1].trim()
                })
            },
            {
                pattern: /(?:close|exit|quit) (?:the )?(?:app |application )?(.+)/i,
                operationType: 'APP_CONTROL',
                extractParams: (matches) => ({
                    action: 'CLOSE',
                    appName: matches[1].trim()
                })
            },
            // System settings
            {
                pattern: /(?:get|show|check) (?:the )?(?:system )?setting (.+)/i,
                operationType: 'SYSTEM_SETTINGS',
                extractParams: (matches) => ({
                    action: 'GET',
                    setting: matches[1].trim()
                })
            },
            {
                pattern: /(?:set|change) (?:the )?(?:system )?setting (.+?) to (.+)/i,
                operationType: 'SYSTEM_SETTINGS',
                extractParams: (matches) => ({
                    action: 'SET',
                    setting: matches[1].trim(),
                    value: matches[2].trim()
                })
            },
            // Command execution
            {
                pattern: /(?:run|execute) (?:the )?command (.+)/i,
                operationType: 'COMMAND_EXECUTION',
                extractParams: (matches) => ({
                    command: matches[1].trim()
                })
            }
        ];
    }
    /**
     * Process natural language input and convert to operation
     */
    async processInput(request) {
        try {
            const { text, context } = request;
            this.logger.debug('Processing input', { text, context });
            const matches = this.findCommandMatches(text);
            this.logger.debug('Found command matches', { matches });
            if (matches.length === 0) {
                this.logger.info('No matching command patterns found', { text });
                return {
                    clarificationNeeded: true,
                    clarificationQuestion: "I'm not sure what operation you want to perform. Could you please rephrase your request?",
                    confidence: 0
                };
            }
            if (matches.length > 1) {
                this.logger.info('Multiple command matches found', { matches });
                const operations = matches.map(match => this.createOperation(match.pattern, match.matches, context));
                return {
                    clarificationNeeded: true,
                    clarificationQuestion: "I found multiple possible operations. Which one did you mean?",
                    confidence: 0.5,
                    alternatives: operations
                };
            }
            const match = matches[0];
            this.logger.debug('Creating operation from match', { match });
            const operation = this.createOperation(match.pattern, match.matches, context);
            this.logger.debug('Created operation', { operation });
            return {
                operation,
                confidence: this.calculateConfidence(match.matches),
                clarificationNeeded: false
            };
        }
        catch (error) {
            this.logger.error('Error processing input', { error, request });
            throw error;
        }
    }
    /**
     * Find matching command patterns
     */
    findCommandMatches(text) {
        const matches = [];
        for (const pattern of this.commandPatterns) {
            const match = text.match(pattern.pattern);
            if (match) {
                matches.push({ pattern, matches: match });
            }
        }
        return matches;
    }
    /**
     * Create operation from pattern match
     */
    createOperation(pattern, matches, context) {
        const params = pattern.extractParams(matches);
        return {
            id: randomUUID(),
            type: pattern.operationType,
            params,
            context: {
                ...context,
                timestamp: new Date(),
                traceId: randomUUID()
            },
            priority: 'MEDIUM',
            status: 'PENDING',
            createdAt: new Date()
        };
    }
    /**
     * Calculate confidence score for match
     */
    calculateConfidence(matches) {
        const fullMatch = matches[0];
        const partialMatches = matches.slice(1);
        if (partialMatches.every(match => match && match.length > 0)) {
            return 0.9; // High confidence if all capture groups matched
        }
        return 0.7; // Medium confidence if only some groups matched
    }
    /**
     * Add custom command pattern
     */
    addCommandPattern(pattern) {
        this.commandPatterns.push(pattern);
    }
}
//# sourceMappingURL=NaturalLanguageInterface.js.map