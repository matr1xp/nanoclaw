# Intent: container/agent-runner/src/index.ts modifications

## What changed
Added Remotion MCP server configuration so the container agent can use video generation tools.

## Key sections

### allowedTools array (inside runQuery → options)
- Added: `'mcp__remotion__*'` to the allowedTools array (after `'mcp__nanoclaw__*'`)

### mcpServers object (inside runQuery → options)
- Added: `remotion` entry as a stdio MCP server
  - command: `'node'`
  - args: resolves to `remotion-mcp-stdio.js` in the same directory as `ipc-mcp-stdio.js`
  - Uses `path.join(path.dirname(mcpServerPath), 'remotion-mcp-stdio.js')` to compute the path
  - env: `REMOTION_CONCURRENCY` and `REMOTION_QUALITY` with defaults

## Invariants (must-keep)
- All existing allowedTools entries unchanged
- nanoclaw MCP server config unchanged
- All other query options (permissionMode, hooks, env, etc.) unchanged
- MessageStream class unchanged
- IPC polling logic unchanged
- Session management unchanged