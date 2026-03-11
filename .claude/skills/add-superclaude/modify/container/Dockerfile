# NanoClaw Agent Container
# Runs Claude Agent SDK in isolated Linux VM with browser automation

FROM node:22-slim

# Install system dependencies for Chromium, PDF tools, and video encoding
RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    libgbm1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libcups2 \
    libdrm2 \
    libxshmfence1 \
    curl \
    git \
    poppler-utils \
    python3 \
    python3-venv \
    pipx \
    && rm -rf /var/lib/apt/lists/*

# Setup pipx environment
ENV PIPX_HOME=/opt/pipx
ENV PIPX_BIN_DIR=/usr/local/bin
ENV PATH="/usr/local/bin:${PATH}"

# Install and configure SuperClaude
RUN pipx install superclaude
RUN superclaude install

# Set Chromium path for agent-browser and Remotion
ENV AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV REMOTION_CHROMIUM_PATH=/usr/bin/chromium

# Disable git credential helpers for non-interactive cloning
ENV GIT_TERMINAL_PROMPT=0
RUN git config --global credential.helper ""
RUN git config --global init.defaultBranch main
# Create credential helper that reads from GITHUB_TOKEN env var at runtime
# Uses echo to avoid showing token in process list (more secure)
RUN echo '#!/bin/bash' > /usr/local/bin/git-credential-github
RUN echo 'echo "username=x"' >> /usr/local/bin/git-credential-github
RUN echo 'echo "password=$GITHUB_TOKEN"' >> /usr/local/bin/git-credential-github
RUN chmod +x /usr/local/bin/git-credential-github
RUN git config --global credential.https://github.com.helper /usr/local/bin/git-credential-github

# Install agent-browser and claude-code globally
RUN npm install -g agent-browser @anthropic-ai/claude-code

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY agent-runner/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY agent-runner/ ./

# Build TypeScript
RUN npm run build

# Install Remotion templates
COPY remotion-templates/ /app/remotion-templates/

# Create workspace directories
RUN mkdir -p /workspace/group /workspace/global /workspace/extra /workspace/ipc/messages /workspace/ipc/tasks /workspace/ipc/input

# Create entrypoint script
# Secrets are passed via stdin JSON — temp file is deleted immediately after Node reads it
# Follow-up messages arrive via IPC files in /workspace/ipc/input/
RUN printf '#!/bin/bash\nset -e\ncd /app && npx tsc --outDir /tmp/dist 2>&1 >&2\nln -s /app/node_modules /tmp/dist/node_modules\nchmod -R a-w /tmp/dist\ncat > /tmp/input.json\nnode /tmp/dist/index.js < /tmp/input.json\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set ownership to node user (non-root) for writable directories
RUN chown -R node:node /workspace && chmod 777 /home/node

# Switch to non-root user (required for --dangerously-skip-permissions)
USER node

# Set working directory to group workspace
WORKDIR /workspace/group

# Entry point reads JSON from stdin, outputs JSON to stdout
ENTRYPOINT ["/app/entrypoint.sh"]
