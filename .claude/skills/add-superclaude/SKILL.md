---
name: add-superclaude
description: Add the SuperClaude Framework to the NanoClaw container. SuperClaude enhances Claude Code with specialized development commands, cognitive personas, and methodologies. Integrates its CLI and MCP capabilities directly into the agent environment.
---

# Add SuperClaude Framework

This skill adds the SuperClaude Framework (superclaude) to NanoClaw's containerized agents.

## Phase 1: Explanation

Explain to the user what will be done:

1. Modifying \`container/Dockerfile\` to install Python, \`pipx\`, and the \`superclaude\` CLI package, and run its installation command to configure tools.
2. Modifying \`container/agent-runner/src/index.ts\` to whitelist MCP tools (\`'mcp__*'\`) so NanoClaw's strict tool filtering doesn't block SuperClaude's enhanced features.

## Phase 2: Apply Code Changes

Run the skills engine to apply this skill's code package. The package files are in this directory alongside this SKILL.md.

### Initialize skills system (if needed)

If \`.nanoclaw/\` directory doesn't exist yet:

```bash
npx tsx scripts/apply-skill.ts --init
```

### Apply the skill

```bash
npx tsx scripts/apply-skill.ts .claude/skills/add-superclaude
```

If the apply reports merge conflicts, read the intent files:
- \`modify/container/Dockerfile.intent.md\`
- \`modify/container/agent-runner/src/index.ts.intent.md\`

## Phase 3: Rebuild the Container

After the code changes are applied, the container image needs to be fully rebuilt.

> **CRITICAL**: The container buildkit caches the build context aggressively. \`--no-cache\` alone does NOT invalidate \`COPY\` steps — the builder's volume retains stale files. To force a truly clean rebuild, you MUST completely prune the builder before re-running the build script.

Instruct the user to run the following (or use Bash to run it for them):

```bash
docker builder prune -a -f
./container/build.sh
```

*(Note: Replace `docker` with the appropriate container runtime if they are using Apple Container or Podman).*

## Phase 4: Verify Customization

Once the container is rebuilt, restart the NanoClaw service.

```bash
launchctl kickstart -k gui/$(id -u)/com.nanoclaw  # macOS
# Linux: systemctl --user restart nanoclaw
```

Tell the user to message their NanoClaw assistant with a SuperClaude command, for example:
\`\`\`
@Andy /sc:research What is SuperClaude Framework?
\`\`\`
