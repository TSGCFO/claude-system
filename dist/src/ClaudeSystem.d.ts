declare class ClaudeSystem {
    private readonly app;
    private readonly logger;
    private toolRegistry;
    private anthropicService;
    private learningSystem;
    private securityManager;
    private promptManager;
    private performanceMonitor;
    private qualityController;
    private roleManager;
    private initialized;
    constructor();
    private initializeComponents;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export default ClaudeSystem;
