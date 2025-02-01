import { Tool } from './Tool.js';
import * as fs from 'fs/promises';
import * as path from 'path';
export class ReadFileTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'read_file',
            description: 'Read the contents of a file',
            parameters: {
                path: {
                    type: 'string',
                    description: 'Path to the file to read',
                    required: true
                }
            }
        };
    }
    async execute(params) {
        try {
            const filePath = path.resolve(process.cwd(), params.path);
            const content = await fs.readFile(filePath, 'utf-8');
            return {
                success: true,
                data: content
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to read file: ${error.message}`
            };
        }
    }
}
export class WriteFileTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'write_file',
            description: 'Write content to a file',
            parameters: {
                path: {
                    type: 'string',
                    description: 'Path to write the file to',
                    required: true
                },
                content: {
                    type: 'string',
                    description: 'Content to write to the file',
                    required: true
                },
                append: {
                    type: 'boolean',
                    description: 'Whether to append to existing content',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const filePath = path.resolve(process.cwd(), params.path);
            const options = params.append ? { flag: 'a' } : undefined;
            // Create directory if it doesn't exist
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, params.content, options);
            return {
                success: true,
                data: `File written successfully: ${params.path}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to write file: ${error.message}`
            };
        }
    }
}
export class ListFilesTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'list_files',
            description: 'List files in a directory',
            parameters: {
                path: {
                    type: 'string',
                    description: 'Directory path to list files from',
                    required: true
                },
                recursive: {
                    type: 'boolean',
                    description: 'Whether to list files recursively',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const dirPath = path.resolve(process.cwd(), params.path);
            const files = await this.listFiles(dirPath, params.recursive);
            return {
                success: true,
                data: files
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to list files: ${error.message}`
            };
        }
    }
    async listFiles(dir, recursive = false) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && recursive) {
                const subFiles = await this.listFiles(fullPath, recursive);
                files.push(...subFiles);
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
export class DeleteFileTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'delete_file',
            description: 'Delete a file',
            parameters: {
                path: {
                    type: 'string',
                    description: 'Path to the file to delete',
                    required: true
                }
            }
        };
    }
    async execute(params) {
        try {
            const filePath = path.resolve(process.cwd(), params.path);
            await fs.unlink(filePath);
            return {
                success: true,
                data: `File deleted successfully: ${params.path}`
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to delete file: ${error.message}`
            };
        }
    }
}
export class SearchFileContentTool extends Tool {
    constructor() {
        super(...arguments);
        this.metadata = {
            name: 'search_file_content',
            description: 'Search for content in files',
            parameters: {
                path: {
                    type: 'string',
                    description: 'Directory path to search in',
                    required: true
                },
                pattern: {
                    type: 'string',
                    description: 'Pattern to search for',
                    required: true
                },
                recursive: {
                    type: 'boolean',
                    description: 'Whether to search recursively',
                    required: false
                }
            }
        };
    }
    async execute(params) {
        try {
            const dirPath = path.resolve(process.cwd(), params.path);
            const matches = await this.searchFiles(dirPath, params.pattern, params.recursive);
            return {
                success: true,
                data: matches
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to search files: ${error.message}`
            };
        }
    }
    async searchFiles(dir, pattern, recursive = false) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const results = [];
        const regex = new RegExp(pattern);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && recursive) {
                const subResults = await this.searchFiles(fullPath, pattern, recursive);
                results.push(...subResults);
            }
            else if (entry.isFile()) {
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (regex.test(content)) {
                        results.push({
                            file: fullPath,
                            matches: content.match(regex)
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to read file during search: ${fullPath}`, error);
                }
            }
        }
        return results;
    }
}
//# sourceMappingURL=FileTool.js.map