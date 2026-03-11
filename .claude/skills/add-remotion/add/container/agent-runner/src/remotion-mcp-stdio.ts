/**
 * Remotion MCP Server for NanoClaw
 * Exposes video generation tools for the container agent.
 * Uses headless Chromium (already in container) for rendering.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VIDEOS_DIR = '/workspace/group/videos';
const TEMPLATES_DIR = '/app/remotion-templates';
const OUTPUT_DIR = path.join(VIDEOS_DIR, 'output');
const REMOTION_STATUS_FILE = '/workspace/ipc/remotion_status.json';

const CHROMIUM_PATH = process.env.REMOTION_CHROMIUM_PATH || process.env.AGENT_BROWSER_EXECUTABLE_PATH || '/usr/bin/chromium';
const CONCURRENCY = parseInt(process.env.REMOTION_CONCURRENCY || '2', 10);
const QUALITY = process.env.REMOTION_QUALITY || 'medium';

const QUALITY_PRESETS: Record<string, { width: number; height: number; fps: number; bitrate: string }> = {
  low: { width: 1280, height: 720, fps: 24, bitrate: '1M' },
  medium: { width: 1920, height: 1080, fps: 30, bitrate: '3M' },
  high: { width: 3840, height: 2160, fps: 30, bitrate: '8M' },
};

function log(msg: string): void {
  console.error(`[REMOTION] ${msg}`);
}

function writeStatus(status: string, detail?: string): void {
  try {
    const data = { status, detail, timestamp: new Date().toISOString() };
    const tmpPath = `${REMOTION_STATUS_FILE}.tmp`;
    fs.mkdirSync(path.dirname(REMOTION_STATUS_FILE), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data));
    fs.renameSync(tmpPath, REMOTION_STATUS_FILE);
  } catch { /* best-effort */ }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getVideoSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function getVideoDuration(filePath: string): string | null {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const secs = parseFloat(result);
    const mins = Math.floor(secs / 60);
    const remainSecs = Math.floor(secs % 60);
    return `${mins}:${remainSecs.toString().padStart(2, '0')}`;
  } catch {
    return null;
  }
}

const server = new McpServer({
  name: 'remotion',
  version: '1.0.0',
});

// Tool: List available templates
server.tool(
  'remotion_list_templates',
  'List available Remotion video templates. Currently includes: text-to-video (animated text with customizable styling).',
  {},
  async () => {
    log('Listing templates...');
    writeStatus('listing', 'Listing available templates');
    try {
      ensureDir(TEMPLATES_DIR);
      const templates = fs.readdirSync(TEMPLATES_DIR).filter(dir => {
        const templatePath = path.join(TEMPLATES_DIR, dir);
        return fs.statSync(templatePath).isDirectory() &&
               fs.existsSync(path.join(templatePath, 'package.json'));
      });

      if (templates.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No templates installed. Templates should be in /app/remotion-templates/' }] };
      }

      const list = templates.map(t => {
        const pkgPath = path.join(TEMPLATES_DIR, t, 'package.json');
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          return `- ${t}: ${pkg.description || 'Video template'}`;
        } catch {
          return `- ${t}`;
        }
      }).join('\n');

      log(`Found ${templates.length} templates`);
      return { content: [{ type: 'text' as const, text: `Available templates:\n${list}` }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list templates: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
);

// Tool: Initialize a video project from template
server.tool(
  'remotion_init_project',
  'Create a new Remotion video project from a template. The project will be created in the group workspace and can be customized.',
  {
    template: z.enum(['text-to-video', 'image-slideshow']).describe('Template to use'),
    project_name: z.string().regex(/^[a-z0-9-]+$/).describe('Name for the new project (lowercase alphanumeric and dashes only)'),
  },
  async (args) => {
    log(`Initializing project: ${args.project_name} from template: ${args.template}`);
    writeStatus('initializing', `Creating ${args.project_name} from ${args.template}`);
    try {
      const templatePath = path.join(TEMPLATES_DIR, args.template);
      if (!fs.existsSync(templatePath)) {
        return {
          content: [{ type: 'text' as const, text: `Template '${args.template}' not found. Use remotion_list_templates to see available templates.` }],
          isError: true,
        };
      }

      const projectPath = path.join(VIDEOS_DIR, args.project_name);
      if (fs.existsSync(projectPath)) {
        return {
          content: [{ type: 'text' as const, text: `Project '${args.project_name}' already exists. Choose a different name or delete the existing project.` }],
          isError: true,
        };
      }

      // Copy template to project directory
      ensureDir(VIDEOS_DIR);
      fs.cpSync(templatePath, projectPath, { recursive: true });

      // Install dependencies
      log(`Installing dependencies for ${args.project_name}...`);
      execSync('npm install', { cwd: projectPath, stdio: 'pipe' });

      log(`Project ${args.project_name} created successfully`);
      writeStatus('ready', `Project ${args.project_name} ready`);
      return {
        content: [{
          type: 'text' as const,
          text: `Project '${args.project_name}' created successfully.\n\nProject location: ${projectPath}\n\nNext steps:\n1. Customize the video by editing components in ${projectPath}/src/\n2. Use remotion_render to generate the video\n\nFor text-to-video template:\n- Edit src/TextVideo.tsx to change text, colors, animation\n- Pass props via remotion_render to customize without editing`
        }]
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`Failed to initialize project: ${errorMsg}`);
      return {
        content: [{ type: 'text' as const, text: `Failed to initialize project: ${errorMsg}` }],
        isError: true,
      };
    }
  },
);

// Tool: Render a video
server.tool(
  'remotion_render',
  'Render a Remotion video project to MP4. The video will be saved to the output directory.',
  {
    project_name: z.string().describe('Project name to render'),
    composition_id: z.string().optional().default('TextVideo').describe('Composition ID (default: TextVideo)'),
    output_name: z.string().optional().describe('Output filename without extension (default: project-timestamp)'),
    props: z.record(z.string(), z.any()).optional().describe('Props to pass to the composition'),
    fps: z.number().min(1).max(60).optional().describe('Frames per second (default: from quality preset)'),
    duration_frames: z.number().min(1).optional().describe('Duration in frames (overrides composition default)'),
  },
  async (args) => {
    const projectPath = path.join(VIDEOS_DIR, args.project_name);
    log(`Rendering project: ${args.project_name}`);
    writeStatus('bundling', `Bundling ${args.project_name}`);

    try {
      if (!fs.existsSync(projectPath)) {
        return {
          content: [{
            type: 'text' as const,
            text: `Project '${args.project_name}' not found. Use remotion_init_project to create it first, or remotion_list_projects to see available projects.`
          }],
          isError: true,
        };
      }

      const quality = QUALITY_PRESETS[QUALITY] || QUALITY_PRESETS.medium;
      const fps = args.fps || quality.fps;
      const compositionId = args.composition_id || 'TextVideo';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const outputName = args.output_name || `${args.project_name}-${timestamp}`;
      const outputPath = path.join(OUTPUT_DIR, `${outputName}.mp4`);

      ensureDir(OUTPUT_DIR);

      // Bundle the Remotion project
      log(`Bundling ${projectPath}...`);
      const bundleResult = await bundle({
        entryPoint: path.join(projectPath, 'src', 'index.ts'),
        webpackOverride: (config) => config,
      });

      log(`Bundle complete: ${bundleResult}`);

      writeStatus('rendering', `Rendering ${args.project_name}`);

      // Select composition
      const composition = await selectComposition({
        serveUrl: bundleResult,
        id: compositionId,
        browserExecutable: CHROMIUM_PATH,
        inputProps: args.props || {},
      });

      log(`Selected composition: ${composition.id}, duration: ${composition.durationInFrames} frames`);

      // Render
      const actualDuration = args.duration_frames || composition.durationInFrames;
      await renderMedia({
        serveUrl: bundleResult,
        composition: {
          ...composition,
          durationInFrames: actualDuration,
          fps,
        },
        outputLocation: outputPath,
        codec: 'h264' as const,
        browserExecutable: CHROMIUM_PATH,
        videoBitrate: quality.bitrate,
        inputProps: args.props || {},
        overwrite: true,
      });

      const size = getVideoSize(outputPath);
      const duration = getVideoDuration(outputPath);
      const sizeMB = (size / 1024 / 1024).toFixed(2);

      log(`Render complete: ${outputPath} (${sizeMB}MB, ${duration || 'unknown duration'})`);
      writeStatus('done', `Rendered ${outputName}.mp4`);

      return {
        content: [{
          type: 'text' as const,
          text: `Video rendered successfully!\n\nFile: ${outputPath}\nSize: ${sizeMB}MB\nDuration: ${duration || 'unknown'}\nResolution: ${quality.width}x${quality.height}\nFPS: ${fps}\n\nThe video is ready to share via your messaging channel.`
        }]
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      log(`Render failed: ${errorMsg}`);
      writeStatus('error', errorMsg);
      return {
        content: [{ type: 'text' as const, text: `Render failed: ${errorMsg}` }],
        isError: true,
      };
    }
  },
);

// Tool: List video projects
server.tool(
  'remotion_list_projects',
  'List all Remotion video projects in the group workspace.',
  {},
  async () => {
    log('Listing projects...');
    try {
      ensureDir(VIDEOS_DIR);
      const entries = fs.readdirSync(VIDEOS_DIR, { withFileTypes: true });
      const projects = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'output')
        .filter(e => fs.existsSync(path.join(VIDEOS_DIR, e.name, 'package.json')))
        .map(e => e.name);

      if (projects.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No video projects found. Use remotion_init_project to create one.' }] };
      }

      const list = projects.map(p => {
        const projectPath = path.join(VIDEOS_DIR, p);
        const stats = fs.statSync(projectPath);
        return `- ${p} (created: ${stats.birthtime.toISOString().slice(0, 10)})`;
      }).join('\n');

      return { content: [{ type: 'text' as const, text: `Video projects:\n${list}` }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list projects: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
);

// Tool: List rendered videos
server.tool(
  'remotion_list_videos',
  'List all rendered videos in the output directory with their sizes and timestamps.',
  {},
  async () => {
    log('Listing videos...');
    try {
      if (!fs.existsSync(OUTPUT_DIR)) {
        return { content: [{ type: 'text' as const, text: 'No videos rendered yet. Use remotion_render to create one.' }] };
      }

      const files = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.mp4'))
        .map(f => {
          const filePath = path.join(OUTPUT_DIR, f);
          const stats = fs.statSync(filePath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          const duration = getVideoDuration(filePath);
          return { name: f, sizeMB, created: stats.birthtime, duration };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      if (files.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No videos in output directory.' }] };
      }

      const list = files.map(f =>
        `- ${f.name} (${f.sizeMB}MB, ${f.duration || 'unknown'}, created: ${f.created.toISOString().slice(0, 10)})`
      ).join('\n');

      return { content: [{ type: 'text' as const, text: `Rendered videos:\n${list}` }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Failed to list videos: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
);

// Tool: Get video info
server.tool(
  'remotion_video_info',
  'Get detailed information about a rendered video including duration, resolution, and file size.',
  {
    video_name: z.string().describe('Video filename (with or without .mp4 extension)'),
  },
  async (args) => {
    const videoName = args.video_name.endsWith('.mp4') ? args.video_name : `${args.video_name}.mp4`;
    const videoPath = path.join(OUTPUT_DIR, videoName);

    try {
      if (!fs.existsSync(videoPath)) {
        return {
          content: [{ type: 'text' as const, text: `Video '${videoName}' not found. Use remotion_list_videos to see available videos.` }],
          isError: true,
        };
      }

      const stats = fs.statSync(videoPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const duration = getVideoDuration(videoPath);

      // Get video dimensions using ffprobe
      let resolution = 'unknown';
      try {
        const result = execSync(
          `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`,
          { encoding: 'utf-8' }
        ).trim();
        const [width, height] = result.split(',').map(Number);
        resolution = `${width}x${height}`;
      } catch { /* ignore */ }

      return {
        content: [{
          type: 'text' as const,
          text: `Video: ${videoName}\nPath: ${videoPath}\nSize: ${sizeMB}MB\nDuration: ${duration || 'unknown'}\nResolution: ${resolution}\nCreated: ${stats.birthtime.toISOString()}`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Failed to get video info: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
);

// Tool: Delete a video
server.tool(
  'remotion_delete_video',
  'Delete a rendered video from the output directory.',
  {
    video_name: z.string().describe('Video filename to delete'),
  },
  async (args) => {
    const videoName = args.video_name.endsWith('.mp4') ? args.video_name : `${args.video_name}.mp4`;
    const videoPath = path.join(OUTPUT_DIR, videoName);

    try {
      if (!fs.existsSync(videoPath)) {
        return {
          content: [{ type: 'text' as const, text: `Video '${videoName}' not found.` }],
          isError: true,
        };
      }

      fs.unlinkSync(videoPath);
      log(`Deleted ${videoName}`);

      return { content: [{ type: 'text' as const, text: `Deleted ${videoName}` }] };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Failed to delete video: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
);

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);