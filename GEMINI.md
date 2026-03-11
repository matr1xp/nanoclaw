# NanoClaw (Gemini Context)

Personal AI assistant running in a single Node.js process with a containerized agent backend. See [README.md](README.md) for philosophy and setup. See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) and [docs/SPEC.md](docs/SPEC.md) for architecture decisions.

## Quick Context

Single Node.js process with skill-based channel system. Channels (WhatsApp, Telegram, Slack, Discord, Gmail) are skills that self-register at startup. Messages route to AI agents running in containers (Linux VMs). Each group has an isolated filesystem and memory.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Orchestrator: state, message loop, agent invocation |
| `src/channels/registry.ts` | Channel registry (self-registration at startup) |
| `src/ipc.ts` | IPC watcher and task processing |
| `src/router.ts` | Message formatting and outbound routing |
| `src/config.ts` | Trigger pattern, paths, intervals |
| `src/container-runner.ts` | Spawns agent containers with mounts |
| `src/task-scheduler.ts` | Runs scheduled tasks |
| `src/db.ts` | SQLite operations |
| `groups/{name}/GEMINI.md` | Per-group memory (isolated) |
| `container/skills/agent-browser.md` | Browser automation tool (available to all agents via Bash) |

## Development & Deployment

Run commands directly natively during tasks instead of asking the user to manually run them.

```bash
npm run dev          # Run with hot reload
npm run build        # Compile TypeScript
npm run test         # Run vitest test suite
./container/build.sh # Rebuild agent container
```

Service management:
```bash
# macOS (launchd)
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl kickstart -k gui/$(id -u)/com.nanoclaw  # restart

# Linux (systemd)
systemctl --user start nanoclaw
systemctl --user stop nanoclaw
systemctl --user restart nanoclaw
```

## Agent Directives for Gemini

1. **Tool Usage:** Always prioritize the most specific capability for the specific task at hand. Avoid command-line workarounds like `cat` for viewing/creating files or `grep` inside bash commands when dedicated file viewing or file searching options exist.
2. **Feature Additions:** NanoClaw doesn't use configuration files for integrations to avoid bloat. Integrate new capabilities (channels, tools, services) via **Skills** rather than embedding large modifications into the core application logic. 
3. **Container Build Cache:** The container buildkit caches the build context aggressively. `--no-cache` alone does NOT invalidate `COPY` steps — the builder's volume retains stale files. To force a truly clean rebuild, completely prune the builder before re-running the build script.
4. **WhatsApp Authentication:** If WhatsApp is not connecting after an upgrade or installation, rememeber it's a separate skill. Using `.claude/skills/add-whatsapp` script or manual build process is needed to enable the integration.
