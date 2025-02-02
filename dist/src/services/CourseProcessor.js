import * as fs from 'fs/promises';
import * as path from 'path';
export class CourseProcessor {
    constructor(coursePath = 'external/courses') {
        this.coursePath = coursePath;
    }
    async loadCourseContent() {
        return {
            prompts: await this.loadPrompts(),
            examples: await this.loadExamples(),
            patterns: await this.loadPatterns(),
            strategies: await this.loadStrategies()
        };
    }
    async loadFromPath(subPath) {
        const fullPath = path.join(this.coursePath, subPath);
        try {
            const files = await fs.readdir(fullPath);
            const contents = await Promise.all(files
                .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
                .map(file => fs.readFile(path.join(fullPath, file), 'utf-8')));
            return contents;
        }
        catch (error) {
            console.error(`Error loading from ${subPath}:`, error);
            return [];
        }
    }
    async loadPrompts() {
        return this.loadFromPath('prompting/templates');
    }
    async loadExamples() {
        return this.loadFromPath('examples');
    }
    async loadPatterns() {
        return this.loadFromPath('patterns');
    }
    async loadStrategies() {
        return this.loadFromPath('strategies');
    }
    async validateContent() {
        const content = await this.loadCourseContent();
        return (content.prompts.length > 0 &&
            content.examples.length > 0 &&
            content.patterns.length > 0 &&
            content.strategies.length > 0);
    }
}
//# sourceMappingURL=CourseProcessor.js.map