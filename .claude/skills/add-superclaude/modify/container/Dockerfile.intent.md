# Intent: Install SuperClaude in the Container

## What needs to change
In `container/Dockerfile`:
1. Add `python3`, `python3-venv`, and `pipx` to the `apt-get install` package list where `chromium`, `ffmpeg`, etc are installed.
2. Ensure the `PIPX_HOME` and `PIPX_BIN_DIR` environment variables are set so `pipx` works for all users.
3. Install `superclaude` globally via `pipx`.
4. Run `superclaude install` to initialize the Claude Code configuration and scripts.

## Invariants
- Do not conflict with the existing `node` or `chromium` installations.
- Only append the Python dependencies; do not remove any existing ones like `libasound2` or `curl`.
- Ensure the commands are run as root before switching to the `USER node` directive at the end.

## Example valid code

```dockerfile
# ... existing apt-get ...
    curl \
    git \
    poppler-utils \
    python3 \
    python3-venv \
    pipx \
    && rm -rf /var/lib/apt/lists/*

# ... later in Dockerfile, before switching to USER node ...

# Setup pipx environment
ENV PIPX_HOME=/opt/pipx
ENV PIPX_BIN_DIR=/usr/local/bin
ENV PATH="/usr/local/bin:${PATH}"

# Install and configure SuperClaude
RUN pipx install superclaude
RUN superclaude install
```
