import { Anthropic } from '@anthropic-ai/sdk';
export class AnthropicService {
    constructor(logger, toolRegistry) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        this.client = new Anthropic({
            apiKey: apiKey
        });
        this.logger = logger;
        this.toolRegistry = toolRegistry;
        this.context = [];
        this.maxContextLength = parseInt(process.env.MAX_CONTEXT_LENGTH || '10', 10);
    }
    async processCommand(command) {
        try {
            // Add command to context
            this.context.push({ role: 'user', content: command });
            this.trimContext();
            // Prepare system message with available tools
            const systemMessage = this.prepareSystemMessage();
            // Create message parameters
            const params = {
                model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
                messages: this.context,
                system: systemMessage,
                max_tokens: parseInt(process.env.MAX_TOKENS || '4096', 10),
                temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
                stream: false
            };
            // Send request to Claude
            const response = await this.client.messages.create(params);
            // Extract response text
            const responseText = response.content[0].text;
            // Add response to context
            this.context.push({ role: 'assistant', content: responseText });
            this.trimContext();
            // Process any tool commands in the response
            const processedResponse = await this.processToolCommands(responseText);
            return processedResponse;
        }
        catch (error) {
            this.logger.error('Error processing command:', error);
            throw error;
        }
    }
    prepareSystemMessage() {
        const tools = this.toolRegistry.getAllToolMetadata();
        const toolDescriptions = tools.map(tool => {
            const params = Object.entries(tool.parameters)
                .map(([name, param]) => `  - ${name} (${param.type}${param.required ? ', required' : ''}): ${param.description}`)
                .join('\n');
            return `${tool.name}:\n${tool.description}\nParameters:\n${params}`;
        }).join('\n\n');
        return `You are an AI assistant with the ability to control a computer system through the following tools:

${toolDescriptions}

To use a tool, format your response like this:
<tool>tool_name</tool>
<parameters>
{
  "param1": "value1",
  "param2": "value2"
}
</parameters>

Always provide clear explanations of what you're doing and handle errors appropriately.
Maintain context of the conversation and previous actions.
If a task requires multiple steps, break it down and execute them sequentially.`;
    }
    async processToolCommands(response) {
        try {
            // Simple regex to extract tool commands
            const toolRegex = /<tool>(.*?)<\/tool>\s*<parameters>([\s\S]*?)<\/parameters>/g;
            let match;
            let processedResponse = response;
            while ((match = toolRegex.exec(response)) !== null) {
                const [fullMatch, toolName, paramsStr] = match;
                try {
                    const params = JSON.parse(paramsStr);
                    const result = await this.toolRegistry.executeTool(toolName, params);
                    // Replace the tool command with its result
                    processedResponse = processedResponse.replace(fullMatch, `Tool ${toolName} result: ${JSON.stringify(result)}`);
                }
                catch (error) {
                    // Replace the tool command with the error
                    processedResponse = processedResponse.replace(fullMatch, `Tool ${toolName} error: ${error.message}`);
                }
            }
            return processedResponse;
        }
        catch (error) {
            this.logger.error('Error processing tool commands:', error);
            return response;
        }
    }
    trimContext() {
        if (this.context.length > this.maxContextLength) {
            // Keep the most recent messages
            this.context = this.context.slice(-this.maxContextLength);
        }
    }
    reset() {
        this.context = [];
        this.logger.info('Context reset');
    }
}
//# sourceMappingURL=AnthropicService.js.map