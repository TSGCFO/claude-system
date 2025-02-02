export interface CourseContent {
    prompts: string[];
    examples: string[];
    patterns: string[];
    strategies: string[];
}
export declare class CourseProcessor {
    private coursePath;
    constructor(coursePath?: string);
    loadCourseContent(): Promise<CourseContent>;
    private loadFromPath;
    private loadPrompts;
    private loadExamples;
    private loadPatterns;
    private loadStrategies;
    validateContent(): Promise<boolean>;
}
