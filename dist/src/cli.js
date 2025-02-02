import { createInterface } from 'node:readline/promises';
import { createLogger, format, transports } from 'winston';
import { AnthropicService } from './services/AnthropicService.js';
import { LearningSystem } from './services/LearningSystem.js';
import { PromptManager } from './services/PromptManager.js';
import { ToolInitializer } from './services/ToolInitializer.js';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
dotenv.config();
// Initialize logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple())
        }),
        new transports.File({
            filename: 'logs/cli.log',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
});
// CLI commands
const commands = {
    '/help': 'Show available commands',
    '/reset': 'Clear context and memory',
    '/tools': 'List available tools',
    '/exit': 'Exit the program',
    '/debug': 'Toggle debug mode',
    '/clear': 'Clear the screen',
    '/analyze': 'Run log analysis',
    '/stats': 'Show interaction statistics'
};
async function startCLI() {
    try {
        // Initialize tool system
        const toolInitializer = ToolInitializer.getInstance(logger);
        const toolRegistry = await toolInitializer.initialize(logger);
        // Initialize learning system
        const learningSystem = new LearningSystem(logger, toolRegistry);
        // Initialize with learning system
        await toolInitializer.reinitialize(logger, learningSystem);
        // Initialize other services
        const promptManager = new PromptManager(logger, toolRegistry);
        const anthropicService = new AnthropicService(logger, toolRegistry);
        // Create readline interface
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let debugMode = false;
        function printHelp() {
            console.log(chalk.cyan('\nAvailable Commands:'));
            Object.entries(commands).forEach(([cmd, desc]) => {
                console.log(chalk.yellow(cmd.padEnd(10)), desc);
            });
            console.log(chalk.gray('\nType any other text to interact with Claude\n'));
        }
        function clearScreen() {
            process.stdout.write('\x1Bc');
        }
        async function showStats() {
            try {
                const analysis = await learningSystem.analyzeRecentLogs(24);
                console.log(chalk.cyan('\nInteraction Statistics:'));
                console.log(chalk.yellow('Success Rate:'), `${(analysis.metrics.success_rate * 100).toFixed(1)}%`);
                console.log(chalk.yellow('Average Response Time:'), `${analysis.metrics.response_time.toFixed(0)}ms`);
                console.log(chalk.yellow('Error Rate:'), `${(analysis.metrics.error_frequency * 100).toFixed(1)}%`);
                console.log(chalk.yellow('Recovery Rate:'), `${(analysis.metrics.recovery_rate * 100).toFixed(1)}%`);
            }
            catch (error) {
                console.error(chalk.red('Error getting statistics:'), error);
            }
        }
        async function handleCommand(command) {
            switch (command.toLowerCase()) {
                case '/help':
                    printHelp();
                    return true;
                case '/reset':
                    await toolInitializer.reinitialize(logger, learningSystem);
                    anthropicService.reset();
                    console.log(chalk.green('Context and memory cleared'));
                    return true;
                case '/tools':
                    const toolMetadata = toolRegistry.getAllToolMetadata();
                    console.log(chalk.cyan('\nAvailable Tools:'));
                    toolMetadata.forEach(tool => {
                        console.log(chalk.yellow(`\n${tool.name}:`));
                        console.log(chalk.gray(tool.description));
                        console.log('Parameters:');
                        Object.entries(tool.parameters).forEach(([name, param]) => {
                            console.log(chalk.gray(`  ${name} (${param.type}${param.required ? ', required' : ''}): ${param.description}`));
                        });
                    });
                    console.log();
                    return true;
                case '/exit':
                    await toolInitializer.cleanup();
                    console.log(chalk.green('\nGoodbye!'));
                    return false;
                case '/debug':
                    debugMode = !debugMode;
                    console.log(chalk.green(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`));
                    return true;
                case '/clear':
                    clearScreen();
                    return true;
                case '/analyze':
                    try {
                        const analysis = await learningSystem.analyzeRecentLogs(24);
                        console.log(chalk.cyan('\nLog Analysis Results:'));
                        console.log(chalk.yellow('Patterns Found:'));
                        analysis.patterns.successful_patterns.forEach(pattern => {
                            console.log(chalk.gray('•'), `Success Pattern: ${pattern.type} (${(pattern.frequency * 100).toFixed(1)}%)`);
                        });
                        analysis.patterns.error_patterns.forEach(pattern => {
                            console.log(chalk.red('•'), `Error Pattern: ${pattern.type} (${(pattern.frequency * 100).toFixed(1)}%)`);
                        });
                        console.log();
                    }
                    catch (error) {
                        console.error(chalk.red('Error analyzing logs:'), error);
                    }
                    return true;
                case '/stats':
                    await showStats();
                    return true;
                default:
                    return true;
            }
        }
        clearScreen();
        console.log(chalk.cyan('\nWelcome to Claude Computer Control'));
        console.log(chalk.gray('Type /help for available commands\n'));
        // Print available tools at startup
        console.log(chalk.cyan('Available Tools:'));
        toolRegistry.getToolNames().forEach(name => {
            console.log(chalk.gray(`• ${name}`));
        });
        console.log();
        while (true) {
            const command = await rl.question(chalk.green('> '));
            if (command.startsWith('/')) {
                const shouldContinue = await handleCommand(command);
                if (!shouldContinue)
                    break;
                continue;
            }
            try {
                console.log(chalk.gray('\nProcessing your request...'));
                const response = await anthropicService.processCommand(command);
                if (debugMode) {
                    console.log(chalk.yellow('\nDebug Info:'));
                    console.log(chalk.gray(JSON.stringify(response, null, 2)));
                }
                console.log(chalk.blue('\nClaude:'), response, '\n');
            }
            catch (error) {
                console.error(chalk.red('Error:'), error.message, '\n');
            }
        }
        rl.close();
    }
    catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}
// Handle cleanup
process.on('SIGINT', async () => {
    const toolInitializer = ToolInitializer.getInstance(logger);
    await toolInitializer.cleanup();
    console.log(chalk.green('\nGoodbye!'));
    process.exit(0);
});
// Start CLI
console.log(chalk.gray('Starting Claude Computer Control...'));
startCLI().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map