Description:
Template for handling web automation tasks using the browser tool.

Web Automation Template:

Task to automate:
{{task}}

Target website:
{{url}}

<task_analysis>
1. Website Analysis:
   - URL structure:
   - Required interactions:
   - Expected elements:
   - Potential dynamic content:

2. Navigation Plan:
   - Initial page:
   - Required clicks:
   - Form inputs:
   - Validation points:

3. Timing Considerations:
   - Load time estimates:
   - Wait conditions:
   - Timeout settings:
   - Retry strategies:

4. Error Prevention:
   - Element existence checks:
   - State validations:
   - Network conditions:
   - Fallback approaches:
</task_analysis>

<automation_steps>
1. Browser Setup:
   ```typescript
   // Launch browser with appropriate settings
   <tool>browser_tool</tool>
   <parameters>
   {
     "operation": "launch",
     "url": "{{url}}"
   }
   </parameters>
   ```

2. Navigation Steps:
   [List each navigation step with selectors]

3. Interaction Steps:
   [List each interaction with selectors and actions]

4. Validation Steps:
   [List validation checks and screenshots]

5. Cleanup:
   ```typescript
   // Close browser after task completion
   <tool>browser_tool</tool>
   <parameters>
   {
     "operation": "close"
   }
   </parameters>
   ```
</automation_steps>

<execution_monitoring>
1. Progress Tracking:
   - Step completion status
   - Time elapsed
   - Resource usage
   - Error counts

2. Success Criteria:
   - Expected page state
   - Required elements
   - Data validation
   - Performance metrics

3. Error Recovery:
   - Connection issues
   - Element not found
   - Timeout handling
   - State recovery
</execution_monitoring>

<completion_report>
1. Task Summary:
   - Steps completed
   - Time taken
   - Success status
   - Issues encountered

2. Validation Results:
   - Page state
   - Data integrity
   - Performance metrics
   - Error count

3. Recommendations:
   - Process improvements
   - Stability enhancements
   - Performance optimization
   - Error prevention
</completion_report>

Note: Always ensure proper error handling and cleanup, especially in case of failures.