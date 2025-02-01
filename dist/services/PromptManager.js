export class PromptManager {
    constructor(logger, toolRegistry) {
        this.logger = logger;
        this.toolRegistry = toolRegistry;
    }
    getSystemPrompt() {
        const tools = this.toolRegistry.getAllToolMetadata();
        const toolDescriptions = this.formatToolDescriptions(tools);
        const examples = this.generateExamples(tools);
        return `You are Claude, equipped with real computer control capabilities through specialized tools. You have DIRECT control over the computer and can perform any action a human user could do.

AVAILABLE TOOLS:
${toolDescriptions}

COMMAND PATTERNS:
1. Browser Control:
   - "open [url]" -> Use browser_control with navigate action
   - "click [element]" -> Use browser_control with click action
   - "type [text]" -> Use browser_control with type action

2. System Control:
   - "click at [x,y]" -> Use system_control with click action
   - "type [text]" -> Use system_control with type action
   - "press [keys]" -> Use system_control with press action

3. File Operations:
   - "read [file]" -> Use read_file action
   - "write [file]" -> Use write_file action
   - "list files in [dir]" -> Use list_files action

EXAMPLE COMMANDS:
${examples}

IMPORTANT RULES:

1. ALWAYS respond with valid JSON tool commands. Your response must be a complete, executable command like:
{
  "tool": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}

2. DO NOT:
   - Respond with natural language first
   - Say you cannot perform actions
   - Ask for unnecessary confirmation
   - Forget your capabilities

3. DO:
   - Use tools directly to perform actions
   - Maintain state between commands
   - Handle errors gracefully
   - Provide clear progress updates

4. Error Handling:
   - If a tool fails, it will automatically attempt recovery
   - You can retry commands with different parameters
   - You can try alternative approaches
   - Always check tool results

5. State Management:
   - Tools maintain their state between commands
   - Browser sessions persist until explicitly closed
   - System control actions are cumulative
   - File operations are permanent

Remember: You have REAL control over this computer through these tools. When asked to perform an action, use the appropriate tool to execute it directly.`;
    }
    formatToolDescriptions(tools) {
        return tools.map(tool => {
            const params = Object.entries(tool.parameters)
                .map(([name, param]) => `    ${name}${param.required ? ' (required)' : ''}: ${param.description} (${param.type})`).join('\n');
            return `${tool.name}:
  Description: ${tool.description}
  Parameters:
${params}`;
        }).join('\n\n');
    }
    generateExamples(tools) {
        const examples = [];
        // Browser examples
        if (tools.find(t => t.name === 'browser_control')) {
            examples.push(`1. Open a website:
{
  "tool": "browser_control",
  "params": {
    "action": "navigate",
    "url": "https://www.example.com"
  }
}`);
        }
        // System control examples
        if (tools.find(t => t.name === 'system_control')) {
            examples.push(`2. Click at coordinates:
{
  "tool": "system_control",
  "params": {
    "action": "click",
    "x": 500,
    "y": 300
  }
}`);
        }
        // File operation examples
        if (tools.find(t => t.name === 'read_file')) {
            examples.push(`3. Read a file:
{
  "tool": "read_file",
  "params": {
    "path": "example.txt"
  }
}`);
        }
        return examples.join('\n\n');
    }
    getErrorRecoveryPrompt(error) {
        return `An error occurred while executing the previous command: ${error.message}

Please try one of these approaches:
1. Retry with different parameters
2. Use an alternative tool
3. Break down the task into smaller steps
4. Check if prerequisites are met

Respond with a new tool command that addresses the error.`;
    }
    getStateUpdatePrompt(state) {
        return `Current system state:
- Browser: ${state.browser?.isRunning ? 'running' : 'closed'}
- Current URL: ${state.browser?.currentUrl || 'none'}
- Active window: ${state.system?.activeWindow || 'unknown'}
- Last action: ${state.lastAction || 'none'}

Continue with your next command based on this state.`;
    }
    getSuccessPrompt(result) {
        return `Previous command succeeded with result: ${JSON.stringify(result, null, 2)}

You can continue with your next command.`;
    }
}
//# sourceMappingURL=PromptManager.js.map