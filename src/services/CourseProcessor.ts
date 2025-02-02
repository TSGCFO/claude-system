import * as fs from 'fs/promises';
import * as path from 'path';

export interface CourseContent {
  prompts: string[];
  examples: string[];
  patterns: string[];
  strategies: string[];
}

export class CourseProcessor {
  private coursePath: string;

  constructor(coursePath: string = 'external/courses') {
    this.coursePath = coursePath;
  }

  async loadCourseContent(): Promise<CourseContent> {
    return {
      prompts: await this.loadPrompts(),
      examples: await this.loadExamples(),
      patterns: await this.loadPatterns(),
      strategies: await this.loadStrategies()
    };
  }

  private async loadFromPath(subPath: string): Promise<string[]> {
    const fullPath = path.join(this.coursePath, subPath);
    try {
      const files = await fs.readdir(fullPath);
      const contents = await Promise.all(
        files
          .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
          .map(file => fs.readFile(path.join(fullPath, file), 'utf-8'))
      );
      return contents;
    } catch (error) {
      console.error(`Error loading from ${subPath}:`, error);
      return [];
    }
  }

  private async loadPrompts(): Promise<string[]> {
    return this.loadFromPath('prompting/templates');
  }

  private async loadExamples(): Promise<string[]> {
    return this.loadFromPath('examples');
  }

  private async loadPatterns(): Promise<string[]> {
    return this.loadFromPath('patterns');
  }

  private async loadStrategies(): Promise<string[]> {
    return this.loadFromPath('strategies');
  }

  async validateContent(): Promise<boolean> {
    const content = await this.loadCourseContent();
    return (
      content.prompts.length > 0 &&
      content.examples.length > 0 &&
      content.patterns.length > 0 &&
      content.strategies.length > 0
    );
  }
}