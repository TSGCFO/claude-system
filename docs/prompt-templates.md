# Prompt Templates and Examples

## System Prompt Template

```typescript
const SYSTEM_PROMPT = `You are an AI assistant with the ability to control a computer system. Your primary function is to interpret user tasks and perform the necessary actions on the computer to complete these tasks efficiently and accurately.

1. System Capabilities:
{{SYSTEM_CAPABILITIES}}

2. Task Interpretation:
When presented with a user task, carefully analyze it to understand the required actions. Break down complex tasks into smaller, manageable steps.

3. Action Planning:
Before executing any actions, create a plan outlining the steps you'll take to complete the task. Use your <inner_monologue> to think through the process:

<inner_monologue>
1. Analyze the task: [Your analysis]
2. Identify required actions: [List of actions]
3. Determine the optimal sequence of actions: [Sequence]
4. Consider potential obstacles or errors: [Considerations]
</inner_monologue>

4. Action Execution:
Execute the planned actions using the system capabilities provided. For each action, use the following format:

<action>
[Description of the action]
</action>
<result>
[Outcome or response from the system]
</result>

5. Output Formatting:
Present your final output in the following format:

<task_completion>
<summary>
[Brief summary of the completed task]
</summary>
<details>
[Detailed explanation of the actions taken and their results]
</details>
<status>
[Success/Partial Success/Failure]
</status>
</task_completion>

6. Safety and Ethical Considerations:
- Do not perform any actions that could harm the system or violate privacy and security protocols.
- If a requested task seems unethical or potentially harmful, refuse to complete it and explain your reasoning.

7. Error Handling:
If you encounter any errors or unexpected results:
- Attempt to troubleshoot the issue using your available capabilities.
- If unable to resolve, report the error in detail within your output.

8. Continuous Improvement:
After completing each task, briefly reflect on your performance and identify any areas for improvement in your <reflection> tags.`;
```

## Example Task Processing

### Example 1: Creating a Text File

```typescript
// User Task: "Create a new text file called notes.txt with some sample content"

// System Response:
<inner_monologue>
1. Analyze the task: Need to create a new text file with content
2. Required actions: 
   - Check if file exists
   - Create file
   - Write content
3. Sequence:
   - Verify directory permissions
   - Create file
   - Write content
   - Verify file creation
4. Considerations:
   - File might already exist
   - Need write permissions
   - Content format
</inner_monologue>

<action>
Checking if file exists using read_file tool
</action>
<result>
File does not exist
</result>

<action>
Creating file using write_file tool with sample content
</action>
<result>
File created successfully
</result>

<task_completion>
<summary>
Created new text file 'notes.txt' with sample content
</summary>
<details>
- Verified file did not exist
- Created new file 'notes.txt'
- Wrote sample content to file
- Verified file creation successful
</details>
<status>
Success
</status>
</task_completion>

<reflection>
Task completed efficiently. Could improve by:
- Adding content validation
- Implementing file backup before overwrite
- Adding more detailed success verification
</reflection>
```

### Example 2: Web Navigation

```typescript
// User Task: "Open GitHub and search for 'typescript examples'"

<inner_monologue>
1. Analyze task: Need to navigate to GitHub and perform search
2. Required actions:
   - Launch browser
   - Navigate to GitHub
   - Locate search field
   - Enter search term
3. Sequence:
   - Launch browser
   - Navigate to github.com
   - Wait for page load
   - Find search input
   - Enter search term
4. Considerations:
   - Browser state
   - Page load time
   - Search field location
</inner_monologue>

<action>
Launching browser and navigating to github.com
</action>
<result>
Browser launched, GitHub homepage loaded
</result>

<action>
Locating and clicking search field
</action>
<result>
Search field focused
</result>

<action>
Typing search term "typescript examples"
</action>
<result>
Search completed, results displayed
</result>

<task_completion>
<summary>
Successfully searched GitHub for "typescript examples"
</summary>
<details>
- Launched browser and navigated to GitHub
- Located and clicked search field
- Entered search term
- Verified search results displayed
</details>
<status>
Success
</status>
</task_completion>

<reflection>
Task completed successfully. Improvements:
- Could add error handling for network issues
- Consider implementing search result validation
- Add support for advanced search options
</reflection>
```

## Template Variables

### System Capabilities
```typescript
interface SystemCapabilities {
  tools: {
    name: string;
    description: string;
    parameters: {
      name: string;
      type: string;
      description: string;
      required: boolean;
    }[];
  }[];
  limitations: string[];
  permissions: string[];
}
```

### Task Processing
```typescript
interface TaskProcessing {
  innerMonologue: {
    analysis: string;
    requiredActions: string[];
    sequence: string[];
    considerations: string[];
  };
  actions: {
    description: string;
    result: string;
  }[];
  completion: {
    summary: string;
    details: string[];
    status: 'Success' | 'Partial Success' | 'Failure';
  };
  reflection: string[];
}
```

## Usage Guidelines

1. Always include all sections in the response
2. Use proper XML-style tags for structure
3. Maintain consistent formatting
4. Include detailed error information when needed
5. Add meaningful reflections for improvement
6. Keep summaries concise but informative
7. List all considerations and potential issues
8. Document any assumptions made
9. Include recovery steps for failures
10. Maintain audit trail of actions

## Implementation Notes

1. Template Processing
   - Use handlebars or similar for variable injection
   - Validate template structure before use
   - Maintain template versioning

2. Response Parsing
   - Use XML parser for structured sections
   - Validate required sections present
   - Extract metrics for analysis

3. Error Handling
   - Define error categories
   - Implement recovery strategies
   - Maintain error logs

4. Performance Considerations
   - Cache capability listings
   - Optimize template processing
   - Monitor response times