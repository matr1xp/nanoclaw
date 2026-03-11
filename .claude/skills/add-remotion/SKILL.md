---
name: add-remotion
description: Add video generation capability via Remotion framework. Create videos programmatically from React components with headless rendering.
---

# Add Remotion Video Generation

This skill adds a stdio-based MCP server that exposes Remotion video generation tools for the container agent. Agents can create and render videos from React components.

Tools added:
- `remotion_list_templates` — list available video templates
- `remotion_init_project` — create a new video project from a template
- `remotion_render` — render a video project to MP4
- `remotion_list_projects` — list video projects in the group workspace
- `remotion_list_videos` — list rendered videos
- `remotion_video_info` — get video metadata (duration, resolution, size)
- `remotion_delete_video` — delete a rendered video

## Phase 1: Pre-flight

### Check if already applied

Read `.nanoclaw/state.yaml`. If `remotion` is in `applied_skills`, skip to Phase 3 (Configure). The code changes are already in place.

### Check prerequisites

Verify Docker is available for container rebuild:

```bash
docker --version
```

Verify ffmpeg is available (will be installed in container):

```bash
ffmpeg -version 2>/dev/null || echo "ffmpeg will be installed in container"
```

## Phase 2: Apply Code Changes

Run the skills engine to apply this skill's code package.

### Initialize skills system (if needed)

If `.nanoclaw/` directory doesn't exist yet:

```bash
npx tsx scripts/apply-skill.ts --init
```

### Apply the skill

```bash
npx tsx scripts/apply-skill.ts .claude/skills/add-remotion
```

This deterministically:
- Adds `container/agent-runner/src/remotion-mcp-stdio.ts` (Remotion MCP server)
- Adds `container/remotion-templates/text-to-video/` (video template)
- Adds `container/skills/remotion/SKILL.md` (agent-facing docs)
- Three-way merges Remotion MCP config into `container/agent-runner/src/index.ts` (allowedTools + mcpServers)
- Merges Remotion dependencies into `container/agent-runner/package.json`
- Adds FFMPEG to `container/Dockerfile`
- Records the application in `.nanoclaw/state.yaml`

If the apply reports merge conflicts, read the intent files:
- `modify/container/agent-runner/src/index.ts.intent.md` — what changed and invariants
- `modify/container/agent-runner/package.json.intent.md` — dependency additions
- `modify/container/Dockerfile.intent.md` — FFMPEG installation

### Copy to per-group agent-runner

Existing groups have a cached copy of the agent-runner source. Copy the new files:

```bash
for dir in data/sessions/*/agent-runner-src; do
  cp container/agent-runner/src/remotion-mcp-stdio.ts "$dir/"
  cp container/agent-runner/src/index.ts "$dir/"
done
```

### Rebuild container

```bash
./container/build.sh
```

### Validate code changes

```bash
npm run build
```

Build must be clean before proceeding.

## Phase 3: Configure

### Set Remotion options (optional)

By default, Remotion uses:
- 2 parallel render threads
- Medium quality (1080p, 30fps)

To customize, add to `.env`:

```bash
REMOTION_CONCURRENCY=4      # More parallel threads
REMOTION_QUALITY=high       # high = 4K, medium = 1080p, low = 720p
```

### Restart the service

```bash
launchctl kickstart -k gui/$(id -u)/com.nanoclaw  # macOS
# Linux: systemctl --user restart nanoclaw
```

## Phase 4: Verify

### Test via WhatsApp/Telegram

Tell the user:

> Send a message like: "create a text video saying 'Hello from NanoClaw'"
>
> The agent should use `remotion_init_project` to create a project, then `remotion_render` to generate the video.

### Check logs if needed

```bash
tail -f logs/nanoclaw.log | grep -i remotion
```

Look for:
- `[REMOTION]` — MCP server activity
- `remotion_init_project` — project creation
- `remotion_render` — render started/completed

## Troubleshooting

### Agent says "Remotion tools not available"

1. Check `container/agent-runner/src/index.ts` has `remotion` in `mcpServers`
2. Check `allowedTools` includes `'mcp__remotion__*'`
3. Verify container was rebuilt: `./container/build.sh`
4. Restart the service

### "ffmpeg not found"

FFMPEG should be installed in the container during build. If missing:

```bash
# Check Dockerfile has ffmpeg in apt-get install
grep ffmpeg container/Dockerfile
```

### Render fails with "Chromium not found"

Remotion uses the same Chromium as agent-browser. Verify:

```bash
# Check REMOTION_CHROMIUM_PATH is set
docker run --rm nanoclaw-agent env | grep CHROMIUM
```

### Video quality is poor

Adjust quality settings:

```bash
REMOTION_QUALITY=high  # 4K resolution
```

Or customize the template's composition for higher resolution.

### "Out of disk space"

Videos can be large. Check available space:

```bash
df -h groups/*/videos/
```

Delete old videos:

```bash
# Agent can use remotion_delete_video tool
# Or manually: rm groups/*/videos/output/*.mp4
```