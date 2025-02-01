import { Anthropic } from '@anthropic-ai/sdk';
import { LearningSystem } from './LearningSystem.js';
import { PromptManager } from './PromptManager.js';
import * as dotenv from 'dotenv';
dotenv.config();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required in .env file');
}
const MODEL = 'claude-3-5-sonnet-latest';
export class AnthropicService {
    constructor(logger, toolRegistry) {
        if (!ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        this.client = new Anthropic({
            apiKey: ANTHROPIC_API_KEY
        });
        this.logger = logger;
        this.toolRegistry = toolRegistry;
        this.learningSystem = new LearningSystem(logger, toolRegistry);
        this.promptManager = new PromptManager(logger, toolRegistry);
        this.state = {
            toolState: {}
        };
    }
    async processCommand(command) {
        try {
            // Update state with current command
            this.state.lastCommand = command;
            // Get system prompt from PromptManager
            const systemPrompt = this.promptManager.getSystemPrompt();
            // Build messages array with context
            const messages = [{
                    role: 'user',
                    content: command
                }];
            // Add error context if there was a previous error
            if (this.state.lastError) {
                messages.unshift({
                    role: 'assistant',
                    content: this.promptManager.getErrorRecoveryPrompt(this.state.lastError)
                });
            }
            // Add state context
            messages.unshift({
                role: 'assistant',
                content: this.promptManager.getStateUpdatePrompt(this.state.toolState)
            });
            // Send request to Claude
            const response = await this.client.messages.create({
                model: MODEL,
                max_tokens: 4096,
                messages,
                system: systemPrompt
            });
            // Parse Claude's response
            const content = response.content[0].text;
            try {
                // Parse tool command
                const toolCommand = JSON.parse(content);
                if (!toolCommand.tool || !toolCommand.params) {
                    throw new Error('Invalid tool command format. Must include "tool" and "params".');
                }
                // Verify tool exists
                if (!this.toolRegistry.hasToolWithName(toolCommand.tool)) {
                    throw new Error(`Tool not found: ${toolCommand.tool}`);
                }
                this.logger.debug('Executing tool command', toolCommand);
                // Validate tool parameters
                const validationErrors = this.toolRegistry.validateToolParams(toolCommand.tool, toolCommand.params);
                if (validationErrors.length > 0) {
                    throw new Error(`Invalid tool parameters: ${validationErrors.join(', ')}`);
                }
                // Execute the tool
                const result = await this.toolRegistry.executeTool(toolCommand.tool, toolCommand.params);
                // Update state based on tool result
                this.updateState(toolCommand.tool, toolCommand.params, result);
                // Log the interaction
                await this.learningSystem.logInteraction({
                    user_input: command,
                    system_prompt: systemPrompt,
                    claude_response: content,
                    tools_used: [{
                            name: toolCommand.tool,
                            params: toolCommand.params,
                            result
                        }],
                    success: result.success,
                    error: result.success ? undefined : {
                        type: 'tool_execution_error',
                        message: result.error || 'Unknown error'
                    },
                    context: {
                        system_state: this.state.toolState,
                        memory_state: {},
                        tool_state: {}
                    }
                });
                if (!result.success) {
                    this.state.lastError = new Error(result.error || 'Tool execution failed');
                    throw this.state.lastError;
                }
                // Clear error state on success
                this.state.lastError = undefined;
                this.state.lastResult = result;
                return `Tool execution result: ${JSON.stringify(result.data, null, 2)}`;
            }
            catch (error) {
                // Log error interaction
                await this.learningSystem.logInteraction({
                    user_input: command,
                    system_prompt: systemPrompt,
                    claude_response: content,
                    tools_used: [],
                    success: false,
                    error: {
                        type: 'parsing_error',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    },
                    context: {
                        system_state: this.state.toolState,
                        memory_state: {},
                        tool_state: {}
                    }
                });
                throw error;
            }
        }
        catch (error) {
            // Update error state
            this.state.lastError = error;
            // Log error interaction
            await this.learningSystem.logInteraction({
                user_input: command,
                system_prompt: this.promptManager.getSystemPrompt(),
                claude_response: '',
                tools_used: [],
                success: false,
                error: {
                    type: 'api_error',
                    message: error.message
                },
                context: {
                    system_state: this.state.toolState,
                    memory_state: {},
                    tool_state: {}
                }
            });
            this.logger.error('Error processing command with Claude', error);
            throw new Error(`Failed to process command: ${error.message}`);
        }
    }
    updateState(tool, params, result) {
        switch (tool) {
            case 'browser_control':
                this.state.toolState.browser = {
                    isRunning: true,
                    currentUrl: params.action === 'navigate' ? params.url : this.state.toolState.browser?.currentUrl
                };
                break;
            case 'system_control':
                this.state.toolState.system = {
                    ...this.state.toolState.system,
                    activeWindow: result.data?.activeWindow
                };
                break;
        }
    }
    // Reset the service state
    reset() {
        this.logger.info('Resetting Anthropic service state');
        this.state = {
            toolState: {}
        };
    }
}
//# sourceMappingURL=AnthropicService.js.map