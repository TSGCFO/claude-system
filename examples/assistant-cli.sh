#!/bin/bash

# CLI script for interacting with the Claude Assistant
# Usage: ./assistant-cli.sh [command|tool] [args...]

# Configuration
SERVER_URL=${CLAUDE_SERVER_URL:-"http://localhost:3000"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if the server is running
check_health() {
    echo -e "${BLUE}Checking system health...${NC}"
    response=$(curl -s "$SERVER_URL/health")
    if [[ $response == *"healthy"* ]]; then
        echo -e "${GREEN}System is healthy${NC}"
        return 0
    else
        echo -e "${RED}System is not healthy${NC}"
        return 1
    fi
}

# Function to send a command
send_command() {
    local command="$1"
    echo -e "${BLUE}Sending command: ${command}${NC}"
    curl -s -X POST "$SERVER_URL/api/command" \
        -H "Content-Type: application/json" \
        -d "{\"command\": \"$command\"}" | jq '.'
}

# Function to execute a tool
execute_tool() {
    local tool="$1"
    local action="$2"
    shift 2
    local params="$@"
    
    echo -e "${BLUE}Executing tool: ${tool} ${action}${NC}"
    curl -s -X POST "$SERVER_URL/api/tool/$tool" \
        -H "Content-Type: application/json" \
        -d "$params" | jq '.'
}

# Function to show usage
show_usage() {
    echo "Usage:"
    echo "  ./assistant-cli.sh command \"your command here\""
    echo "  ./assistant-cli.sh tool browser launch '{\"url\": \"https://example.com\"}'"
    echo "  ./assistant-cli.sh tool file read '{\"path\": \"test.txt\"}'"
    echo "  ./assistant-cli.sh tool system execute '{\"command\": \"ls -la\"}'"
    echo "  ./assistant-cli.sh health"
    echo ""
    echo "Environment variables:"
    echo "  CLAUDE_SERVER_URL - Server URL (default: http://localhost:3000)"
}

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed${NC}"
    exit 1
fi

# Main script logic
case "$1" in
    "command")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Command is required${NC}"
            show_usage
            exit 1
        fi
        check_health && send_command "$2"
        ;;
    "tool")
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            echo -e "${RED}Error: Tool name, action, and parameters are required${NC}"
            show_usage
            exit 1
        fi
        check_health && execute_tool "$2" "$3" "$4"
        ;;
    "health")
        check_health
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo -e "${RED}Error: Invalid command${NC}"
        show_usage
        exit 1
        ;;
esac

# Examples:
# ./assistant-cli.sh command "What is the weather in San Francisco?"
# ./assistant-cli.sh tool browser launch '{"url": "https://example.com"}'
# ./assistant-cli.sh tool file read '{"path": "test.txt"}'
# ./assistant-cli.sh tool system execute '{"command": "ls -la"}'
# ./assistant-cli.sh health