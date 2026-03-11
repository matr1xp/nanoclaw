# Intent: container/agent-runner/package.json modifications

## What changed
Added Remotion dependencies for video generation capability.

## Key sections

### dependencies
- Added `remotion`: "^4.0.0" — Core Remotion framework
- Added `@remotion/bundler`: "^4.0.0" — Bundles Remotion projects
- Added `@remotion/renderer`: "^4.0.0" — Renders videos headlessly

## Invariants (must-keep)
- All existing dependencies unchanged
- devDependencies unchanged
- Scripts unchanged