# Intent: container/Dockerfile modifications

## What changed
Added FFMPEG for video encoding and Remotion template installation.

## Key sections

### apt-get install
- Added `ffmpeg` for video encoding support
- Added `poppler-utils` for PDF tools (already present in some installations)

### ENV variables
- Added `REMOTION_CHROMIUM_PATH=/usr/bin/chromium` to point Remotion to the container's Chromium

### COPY remotion-templates
- Added `COPY remotion-templates/ /app/remotion-templates/` to install video templates in the container

## Invariants (must-keep)
- All existing dependencies unchanged
- Node version unchanged
- Entrypoint script logic unchanged
- Working directory setup unchanged