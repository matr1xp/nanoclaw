import { describe, it, expect } from 'vitest';

describe('add-remotion skill', () => {
  it('should have valid manifest', async () => {
    const { default: yaml } = await import('js-yaml');
    const fs = await import('fs');
    const path = await import('path');

    const manifestPath = path.join(__dirname, '..', 'manifest.yaml');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(manifestContent) as Record<string, unknown>;

    expect(manifest.skill).toBe('remotion');
    expect(manifest.version).toBeDefined();
    expect(manifest.description).toBeDefined();
    expect(manifest.adds).toBeInstanceOf(Array);
    expect(manifest.modifies).toBeInstanceOf(Array);
  });

  it('should list all added files in manifest', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const skillDir = path.join(__dirname, '..');
    const addDir = path.join(skillDir, 'add');

    // Check that all files in add/ exist
    const expectedFiles = [
      'container/agent-runner/src/remotion-mcp-stdio.ts',
      'container/remotion-templates/text-to-video/package.json',
      'container/remotion-templates/text-to-video/tsconfig.json',
      'container/remotion-templates/text-to-video/remotion.config.ts',
      'container/remotion-templates/text-to-video/src/index.ts',
      'container/remotion-templates/text-to-video/src/Root.tsx',
      'container/remotion-templates/text-to-video/src/TextVideo.tsx',
      'container/skills/remotion/SKILL.md',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(addDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it('should have valid Remotion MCP server', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const mcpPath = path.join(__dirname, '..', 'add', 'container', 'agent-runner', 'src', 'remotion-mcp-stdio.ts');
    const content = fs.readFileSync(mcpPath, 'utf-8');

    // Check for required MCP server components
    expect(content).toContain("McpServer");
    expect(content).toContain("StdioServerTransport");
    expect(content).toContain("remotion_list_templates");
    expect(content).toContain("remotion_init_project");
    expect(content).toContain("remotion_render");
    expect(content).toContain("remotion_list_projects");
    expect(content).toContain("remotion_list_videos");
    expect(content).toContain("remotion_video_info");
    expect(content).toContain("remotion_delete_video");
  });

  it('should have valid text-to-video template', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const templateDir = path.join(__dirname, '..', 'add', 'container', 'remotion-templates', 'text-to-video');

    // Check package.json has remotion dependencies
    const pkgPath = path.join(templateDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.dependencies.remotion).toBeDefined();
    expect(pkg.dependencies['@remotion/cli']).toBeDefined();

    // Check React components exist
    expect(fs.existsSync(path.join(templateDir, 'src', 'Root.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(templateDir, 'src', 'TextVideo.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(templateDir, 'src', 'index.ts'))).toBe(true);
  });

  it('should have modification files with intent docs', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const modifyDir = path.join(__dirname, '..', 'modify');

    // Check Dockerfile and intent
    expect(fs.existsSync(path.join(modifyDir, 'container', 'Dockerfile'))).toBe(true);
    expect(fs.existsSync(path.join(modifyDir, 'container', 'Dockerfile.intent.md'))).toBe(true);

    // Check package.json and intent
    expect(fs.existsSync(path.join(modifyDir, 'container', 'agent-runner', 'package.json'))).toBe(true);

    // Check index.ts and intent
    expect(fs.existsSync(path.join(modifyDir, 'container', 'agent-runner', 'src', 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(modifyDir, 'container', 'agent-runner', 'src', 'index.ts.intent.md'))).toBe(true);
  });

  it('should add ffmpeg to Dockerfile', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const dockerfilePath = path.join(__dirname, '..', 'modify', 'container', 'Dockerfile');
    const content = fs.readFileSync(dockerfilePath, 'utf-8');

    expect(content).toContain('ffmpeg');
    expect(content).toContain('REMOTION_CHROMIUM_PATH');
  });

  it('should add remotion dependencies to package.json', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const pkgPath = path.join(__dirname, '..', 'modify', 'container', 'agent-runner', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.dependencies.remotion).toBeDefined();
    expect(pkg.dependencies['@remotion/bundler']).toBeDefined();
    expect(pkg.dependencies['@remotion/renderer']).toBeDefined();
  });

  it('should register remotion MCP server in index.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const indexPath = path.join(__dirname, '..', 'modify', 'container', 'agent-runner', 'src', 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Check allowedTools includes remotion
    expect(content).toContain("'mcp__remotion__*'");

    // Check mcpServers includes remotion
    expect(content).toContain('remotion:');
    expect(content).toContain('remotion-mcp-stdio.js');
  });
});