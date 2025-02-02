import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface SetupConfig {
  repositories: {
    courses: string;
    sdk: string;
  };
  paths: {
    external: string;
    courses: string;
    sdk: string;
  };
}

const config: SetupConfig = {
  repositories: {
    courses: 'https://github.com/anthropics/courses.git',
    sdk: 'https://github.com/anthropics/anthropic-sdk-typescript.git'
  },
  paths: {
    external: 'external',
    courses: 'external/courses',
    sdk: 'external/anthropic-sdk'
  }
};

async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function cloneRepository(url: string, path: string): Promise<void> {
  try {
    console.log(`Cloning ${url} into ${path}...`);
    await execAsync(`git clone ${url} ${path}`);
    console.log(`Successfully cloned ${url}`);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`Repository already exists in ${path}`);
    } else {
      throw error;
    }
  }
}

async function installDependencies(): Promise<void> {
  try {
    console.log('Installing dependencies...');
    await execAsync('npm install @anthropic-ai/sdk');
    console.log('Successfully installed dependencies');
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error}`);
  }
}

async function setupCourseProcessor(): Promise<void> {
  const processorPath = path.join('src', 'services', 'CourseProcessor.ts');
  const content = `import * as fs from 'fs/promises';
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
      console.error(\`Error loading from \${subPath}:\`, error);
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
}`;

  await fs.writeFile(processorPath, content, 'utf-8');
  console.log('Created CourseProcessor service');
}

async function main() {
  try {
    // Create external directory
    await ensureDirectoryExists(config.paths.external);

    // Clone repositories
    await cloneRepository(config.repositories.courses, config.paths.courses);
    await cloneRepository(config.repositories.sdk, config.paths.sdk);

    // Install dependencies
    await installDependencies();

    // Setup course processor
    await setupCourseProcessor();

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();