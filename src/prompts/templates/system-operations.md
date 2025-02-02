Description:
Template for handling system operations and file management tasks.

System Operations Template:

Task description:
{{task}}

Required operations:
{{operations}}

<security_check>
1. Permission Analysis:
   - Required permissions:
   - Current access level:
   - Security implications:
   - Risk assessment:

2. Resource Requirements:
   - Disk space:
   - Memory usage:
   - CPU impact:
   - Network usage:

3. Safety Checks:
   - File system impact:
   - Process interference:
   - System stability:
   - Data integrity:
</security_check>

<operation_plan>
1. File Operations:
   ```typescript
   // File system operations
   <tool>file_tool</tool>
   <parameters>
   {
     "operation": "{{operation}}",
     "path": "{{path}}",
     "content": "{{content}}"
   }
   </parameters>
   ```

2. System Control:
   ```typescript
   // System control operations
   <tool>system_control</tool>
   <parameters>
   {
     "operation": "{{operation}}",
     "command": "{{command}}"
   }
   </parameters>
   ```

3. Validation Steps:
   - File existence checks
   - Permission verification
   - Content validation
   - System state verification
</operation_plan>

<execution_safeguards>
1. Backup Procedures:
   - Critical files backup
   - State preservation
   - Recovery points
   - Rollback plan

2. Error Prevention:
   - Path validation
   - Permission checks
   - Resource monitoring
   - Operation atomicity

3. Progress Monitoring:
   - Operation status
   - Resource usage
   - Error detection
   - Performance metrics
</execution_safeguards>

<cleanup_procedures>
1. Resource Cleanup:
   - Temporary files
   - Process termination
   - Memory cleanup
   - Lock release

2. State Verification:
   - System stability
   - File integrity
   - Process status
   - Resource availability
</cleanup_procedures>

<operation_report>
1. Execution Summary:
   - Operations completed
   - Success status
   - Time taken
   - Resource impact

2. Validation Results:
   - File system state
   - System stability
   - Data integrity
   - Performance impact

3. Recommendations:
   - Process improvements
   - Security enhancements
   - Performance optimization
   - Monitoring improvements
</operation_report>

Note: Always prioritize system stability and data safety when performing system operations.