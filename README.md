# Claude Computer Control System

A sophisticated system that allows Claude to control your computer through natural language commands, with enhanced context awareness and memory management.

## Features

### Core Capabilities
- File operations (read, write, list, search)
- Web browser control (navigation, clicking, typing)
- System operations (execute commands, launch apps)
- Process management
- System information retrieval

### Enhanced Features
- Context awareness and state management
- Memory of past interactions and tool usage
- Intelligent command processing
- Enhanced error handling and recovery
- Session management

## Prerequisites

1. Node.js v18 or higher
2. An Anthropic API key (get one at https://console.anthropic.com/)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/claude-system.git
cd claude-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to the .env file:
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

### Interactive CLI

Run the enhanced CLI interface:

```bash
npm run cli
```

### CLI Commands

- `/help` - Show available commands
- `/reset` - Clear context and memory
- `/tools` - List available tools
- `/debug` - Toggle debug mode
- `/clear` - Clear the screen
- `/exit` - Exit the program

### Example Interactions

1. File Operations:
```
> Create a file called todo.txt with my tasks for today
> Read the contents of todo.txt
> Search for files containing the word "important"
```

2. Web Navigation:
```
> Open github.com in the browser
> Click the login button
> Type "my-username" in the username field
```

3. System Operations:
```
> What are my system's specifications?
> List all running processes
> Launch Visual Studio Code
```

### Context and Memory

The system maintains:
- Current task context
- Tool usage history
- System state
- Session information
- Browser state

This enables Claude to:
- Remember previous interactions
- Maintain context across commands
- Handle multi-step operations
- Provide more relevant responses
- Learn from past tool usage

## Available Tools

### File Operations
- `read_file`: Read file contents
- `write_file`: Write content to a file
- `list_files`: List files in a directory
- `delete_file`: Delete a file
- `search_file_content`: Search for text in files

### Browser Control
- `navigate_web`: Open and navigate to websites
- `click_element`: Click elements on webpages
- `type_text`: Type text into input fields
- `get_page_content`: Get webpage content
- `take_screenshot`: Take screenshots

### System Operations
- `execute_command`: Run system commands
- `launch_application`: Start applications
- `get_system_info`: Get system information
- `process_control`: Manage system processes

## Security

- The system runs with your user permissions
- All operations are logged for auditing
- File operations are restricted to the working directory by default
- Commands are validated before execution
- Session state is maintained securely

## Logs

Logs are stored in the `logs` directory:
- `cli.log`: CLI interactions and commands
- `server.log`: Server operations
- `audit.log`: Security events

## Development

Build the project:
```bash
npm run build
```

Run in development mode:
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.