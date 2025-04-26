# SOFIA Unified Startup Scripts

This directory contains unified scripts to start all SOFIA services.

## Usage

### Starting all services

To start all services with the CLI UI (default):

```bash
python script/start.py
```

To start with the web UI:

```bash
python script/start.py --ui web
```

### Debug mode

To enable debug logging:

```bash
python script/start.py --debug
```

## Available options

- `--ui`: Select UI mode (`cli` or `web`, default: `cli`)
- `--debug`: Enable debug logging

## Architecture

The unified startup script:

1. Starts the agent service components:
   - Arithmetic Tool
   - Agent
2. Starts the selected UI (CLI or Web)
3. Monitors all processes and handles clean shutdown

All dependencies are consolidated into the root-level `requirements.txt` file. Individual Dockerfiles and requirements.txt files in subdirectories have been removed to simplify the project structure.
