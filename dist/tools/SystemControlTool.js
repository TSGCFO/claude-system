import { Tool } from './Tool.js';
import * as robot from 'robotjs';
export class SystemControlTool extends Tool {
    constructor(logger) {
        super(logger);
        this.metadata = {
            name: 'system_control',
            description: 'Control system with keyboard and mouse',
            parameters: {
                action: {
                    type: 'string',
                    description: 'Action to perform (type, press, click, move, drag, get_mouse_pos)',
                    required: true
                },
                text: {
                    type: 'string',
                    description: 'Text to type',
                    required: false
                },
                keys: {
                    type: 'array',
                    description: 'Keys to press (for keyboard shortcuts)',
                    required: false
                },
                x: {
                    type: 'number',
                    description: 'X coordinate for mouse actions',
                    required: false
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate for mouse actions',
                    required: false
                },
                button: {
                    type: 'string',
                    description: 'Mouse button (left, right)',
                    required: false
                }
            }
        };
        // Configure robot.js if methods are available
        if (typeof robot.setMouseDelay === 'function') {
            robot.setMouseDelay(1);
        }
        if (typeof robot.setKeyboardDelay === 'function') {
            robot.setKeyboardDelay(1);
        }
    }
    async execute(params) {
        try {
            switch (params.action) {
                case 'type':
                    return this.typeText(params.text);
                case 'press':
                    return this.pressKeys(params.keys);
                case 'click':
                    return this.mouseClick(params.x, params.y, params.button);
                case 'move':
                    return this.mouseMove(params.x, params.y);
                case 'get_mouse_pos':
                    return this.getMousePosition();
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${params.action}`
                    };
            }
        }
        catch (error) {
            this.logger.error('System control error:', error);
            return {
                success: false,
                error: `System control error: ${error.message}`
            };
        }
    }
    typeText(text) {
        if (!text) {
            return {
                success: false,
                error: 'Text is required for type action'
            };
        }
        try {
            if (typeof robot.typeString === 'function') {
                robot.typeString(text);
                return {
                    success: true,
                    data: `Typed text: ${text}`
                };
            }
            else {
                throw new Error('typeString function not available');
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to type text: ${error.message}`
            };
        }
    }
    pressKeys(keys) {
        if (!keys || keys.length === 0) {
            return {
                success: false,
                error: 'Keys are required for press action'
            };
        }
        try {
            if (typeof robot.keyTap !== 'function' || typeof robot.keyToggle !== 'function') {
                throw new Error('Keyboard functions not available');
            }
            // Handle modifier keys
            const modifiers = keys.filter(key => ['shift', 'control', 'alt', 'command'].includes(key.toLowerCase()));
            // Get the main key (last non-modifier key)
            const mainKey = keys.filter(key => !['shift', 'control', 'alt', 'command'].includes(key.toLowerCase())).pop();
            if (!mainKey) {
                return {
                    success: false,
                    error: 'No main key provided'
                };
            }
            // Hold modifiers
            modifiers.forEach(modifier => {
                robot.keyToggle(modifier, 'down');
            });
            // Press and release main key
            robot.keyTap(mainKey);
            // Release modifiers in reverse order
            modifiers.reverse().forEach(modifier => {
                robot.keyToggle(modifier, 'up');
            });
            return {
                success: true,
                data: `Pressed keys: ${keys.join('+')}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to press keys: ${error.message}`
            };
        }
    }
    mouseClick(x, y, button = 'left') {
        if (typeof x !== 'number' || typeof y !== 'number') {
            return {
                success: false,
                error: 'X and Y coordinates are required for click action'
            };
        }
        try {
            if (typeof robot.moveMouse !== 'function' || typeof robot.mouseClick !== 'function') {
                throw new Error('Mouse functions not available');
            }
            robot.moveMouse(x, y);
            robot.mouseClick(button);
            return {
                success: true,
                data: `Clicked ${button} button at ${x},${y}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to click mouse: ${error.message}`
            };
        }
    }
    mouseMove(x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            return {
                success: false,
                error: 'X and Y coordinates are required for move action'
            };
        }
        try {
            if (typeof robot.moveMouse !== 'function') {
                throw new Error('Mouse functions not available');
            }
            robot.moveMouse(x, y);
            return {
                success: true,
                data: `Moved mouse to ${x},${y}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to move mouse: ${error.message}`
            };
        }
    }
    getMousePosition() {
        try {
            if (typeof robot.getMousePos !== 'function') {
                throw new Error('Mouse functions not available');
            }
            const pos = robot.getMousePos();
            return {
                success: true,
                data: pos
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get mouse position: ${error.message}`
            };
        }
    }
}
//# sourceMappingURL=SystemControlTool.js.map