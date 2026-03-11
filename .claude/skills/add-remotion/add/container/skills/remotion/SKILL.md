---
name: remotion
description: Create and render videos programmatically using React components. Generate animations, text videos, and custom compositions with headless rendering.
---

# Video Generation with Remotion

Create videos from React components. Use templates for quick results or build custom compositions.

## Quick Start

```typescript
// 1. Create a video project
remotion_init_project({ template: "text-to-video", project_name: "my-intro" })

// 2. Render the video
remotion_render({ project_name: "my-intro", props: { text: "Hello World!" } })

// 3. Result: /workspace/group/videos/output/my-intro-2024-01-15T12-30-00.mp4
```

## Available Templates

### text-to-video

Animated text with customizable:
- `text`: The text to display (supports newlines)
- `fontSize`: Font size in pixels (default: 72)
- `fontFamily`: Font family (default: "Inter, sans-serif")
- `textColor`: Text color hex (default: "#ffffff")
- `backgroundColor`: Background color hex (default: "#1a1a2e")
- `animation`: Animation style (fadeSlideUp, fadeSlideDown, fadeIn, scale)

## Tools

### remotion_list_templates
List available video templates.

### remotion_init_project
Create a new video project from a template.
- `template`: Template to use ("text-to-video")
- `project_name`: Project name (lowercase, alphanumeric, dashes)

### remotion_render
Render a video project to MP4.
- `project_name`: Project to render
- `props`: Props to pass to composition (optional)
- `output_name`: Output filename without extension (optional)
- `fps`: Frames per second (optional, default from quality preset)
- `duration_frames`: Duration in frames (optional)

### remotion_list_projects
List all video projects in the workspace.

### remotion_list_videos
List rendered videos with sizes and timestamps.

### remotion_video_info
Get detailed video metadata (duration, resolution, size).

### remotion_delete_video
Delete a rendered video file.

## Workflow Examples

### Simple text video
```
remotion_init_project({ template: "text-to-video", project_name: "welcome" })
remotion_render({
  project_name: "welcome",
  props: {
    text: "Welcome to my channel!",
    fontSize: 80,
    textColor: "#00ff88"
  }
})
```

### Multi-line text
```
remotion_render({
  project_name: "announcement",
  props: {
    text: "Big News!\n\nWe're launching tomorrow!",
    backgroundColor: "#000000"
  }
})
```

### Custom animation
```
remotion_render({
  project_name: "scale-intro",
  props: {
    text: "POW!",
    animation: "scale",
    fontSize: 120
  }
})
```

## Customizing Projects

After initializing, edit React components directly:

```bash
# Edit the text component
/workspace/group/videos/my-project/src/TextVideo.tsx
```

Then render with custom props or let the edits be permanent.

## Output Location

- Projects: `/workspace/group/videos/{project_name}/`
- Videos: `/workspace/group/videos/output/{project}-{timestamp}.mp4`

## Quality Settings

Set via `REMOTION_QUALITY` environment variable:
- `low`: 720p, 24fps, 1Mbps
- `medium`: 1080p, 30fps, 3Mbps (default)
- `high`: 4K, 30fps, 8Mbps