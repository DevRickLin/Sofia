# Agent Service

This service provides arithmetic calculation capabilities through an LLM-based agent.

## Setup

Install dependencies using the centralized requirements file:

```bash
# From project root
pip install -r requirements.txt
```

Or install the service-specific requirements:

```bash
# From this directory
pip install -r requirements.txt
```

## Running the Service

Start the service using the provided script:

```bash
python start.py
```

This will start:

1. The arithmetic tool
2. The agent
3. The client (interactive mode)

Use `--no-client` flag to start without the client:

```bash
python start.py --no-client
```
