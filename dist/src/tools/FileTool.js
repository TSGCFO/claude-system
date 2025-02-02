import { Tool } from './Tool.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class FileTool extends Tool {
    constructor(logger) {
        super(logger);
    }
    get metadata() {
        return {
            name: 'file_tool',
            description: 'Perform file system operations',
            parameters: {
                operation: {
                    type: 'string',
                    description: 'Operation to perform (read, write, delete, list, search)',
                    required: true
                },
                path: {
                    type: 'string',
                    description: 'File or directory path',
                    required: true
                },
                content: {
                    type: 'string',
                    description: 'Content to write (for write operation)',
                    required: false
                },
                pattern: {
                    type: 'string',
                    description: 'Search pattern (for search operation)',
                    required: false
                },
                recursive: {
                    type: 'boolean',
                    description: 'Perform operation recursively (for list/search operations)',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const { operation, path: filePath, content, pattern, recursive } = params;
            switch (operation) {
                case 'read':
                    return await this.readFile(filePath);
                case 'write':
                    return await this.writeFile(filePath, content);
                case 'delete':
                    return await this.deleteFile(filePath);
                case 'list':
                    return await this.listFiles(filePath, recursive);
                case 'search':
                    return await this.searchFiles(filePath, pattern, recursive);
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        }
        catch (error) {
            this.logger.error('File operation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async readFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return {
                success: true,
                data: content
            };
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }
    async writeFile(filePath, content) {
        try {
            if (!content) {
                throw new Error('Content is required for write operation');
            }
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
            return {
                success: true,
                data: 'File written successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            return {
                success: true,
                data: 'File deleted successfully'
            };
        }
        catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    async listFiles(dirPath, recursive) {
        try {
            const files = await this.readDirectory(dirPath, recursive);
            return {
                success: true,
                data: files
            };
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
    async readDirectory(dirPath, recursive) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory() && recursive) {
                const subFiles = await this.readDirectory(fullPath, recursive);
                files.push(...subFiles);
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    }
    async searchFiles(dirPath, pattern, recursive) {
        try {
            if (!pattern) {
                throw new Error('Pattern is required for search operation');
            }
            const files = await this.readDirectory(dirPath, recursive);
            const regex = new RegExp(pattern);
            const matches = [];
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    if (regex.test(content)) {
                        matches.push(file);
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to read file during search: ${file}`, error);
                }
            }
            return {
                success: true,
                data: matches
            };
        }
        catch (error) {
            throw new Error(`Failed to search files: ${error.message}`);
        }
    }
    async cleanup() {
        // No cleanup needed for file operations
    }
}
//# sourceMappingURL=FileTool.js.map