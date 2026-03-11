# Intent: Allow MCP Tools in Agent Runner

## What needs to change
In `container/agent-runner/src/index.ts`:
Modify the `allowedTools` array inside the `query(...)` options payload to include `'mcp__*'`. 

This ensures that any MCP servers registered globally in the container by `superclaude install` (such as Tavily, Context7, etc) are not rejected by NanoClaw's rigid tool filtering.

## Invariants
- Existing explicit tool grants (e.g., `'Bash'`, `'Read'`, `'Write'`, `'mcp__nanoclaw__*'`) must not be removed.
- Simply append `'mcp__*'` to the array if it isn't already wildcarded.

## Example valid code

```typescript
      allowedTools: [
        'Bash',
        'Read', 'Write', 'Edit', 'Glob', 'Grep',
        'WebSearch', 'WebFetch',
        'Task', 'TaskOutput', 'TaskStop',
        'TeamCreate', 'TeamDelete', 'SendMessage',
        'TodoWrite', 'ToolSearch', 'Skill',
        'NotebookEdit',
        'mcp__nanoclaw__*',
        'mcp__remotion__*',
        'mcp__*'
      ],
```
