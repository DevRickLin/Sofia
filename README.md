# 🌐 S.O.F.I.A.
**Search-Oriented Functional Intelligence Agent**

> A modular, search-centric AI agent framework designed to integrate structured information flow and intelligent decision-making.

## Overview

S.O.F.I.A. is a agent system built with the following technologies:
- [LangGraph](https://github.com/langchain-ai/langgraph) for agent workflow
- [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) for tool management
- [Agent2Agent Protocol (A2A)](https://github.com/google/A2A) for agent communication and interoperability

## Demo Implementation: Arithmetic Agent

This repo contains a basic demo implementation of the SOFIA framework focused on arithmetic operations. The demo consists of:

1. **Arithmetic Tool**: A service that performs basic arithmetic operations (addition, subtraction, multiplication, division)
2. **Demo Agent**: A simple agent that uses the arithmetic tool to process user requests
3. **Demo Client**: A client that communicates with the agent using the A2A protocol

The demo supports natural language arithmetic queries like:
- "What is 5 + 3?"
- "Calculate 10 * 7"
- "Divide 100 by 2"
- "What is the sum of 4, 8, and 12?"

## Article Quality Assessment

The system also includes an article quality assessment tool that evaluates text content using advanced LLM prompting. This feature:

1. Uses sophisticated prompts to analyze articles on 12 different dimensions:
   - 文本连贯性 (Text coherence)
   - 论点完整性 (Argument completeness)
   - 语言质量 (Language quality)
   - 信息密度 (Information density)
   - 结构合理性 (Structural reasonability)
   - 术语使用 (Terminology usage)
   - 内容独特性 (Content uniqueness)
   - 深度分析 (Depth of analysis)
   - 内部一致性 (Internal consistency)
   - 推理质量 (Reasoning quality)
   - 上下文理解 (Contextual understanding)
   - 文本复杂度平衡 (Text complexity balance)

2. Provides comprehensive evaluation including:
   - Detailed scores for each dimension
   - Analysis of the article's strengths and weaknesses
   - General evaluation of the content quality

3. Environment Requirements:
   - The feature requires an OpenAI API key to be set in your environment
   - Uses the LLM model specified in your .env file (defaults to gpt-3.5-turbo)

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Configure your environment variables by editing the `.env` file:
   ```
   # Server Configuration
   A2A_SERVER_HOST=0.0.0.0
   A2A_SERVER_PORT=8000

   # External Services
   ARITHMETIC_TOOL_URL=http://localhost:5001

   # API Keys
   OPENAI_API_KEY=your_openai_api_key_here

   # Model Configuration
   LLM_MODEL=gpt-3.5-turbo
   ```
   
   Be sure to replace `your_openai_api_key_here` with your actual OpenAI API key.

## Running the Project

You can run S.O.F.I.A. in two ways:

1. Using the startup script:
   ```bash
   python start.py
   ```

   Options:
   ```
   --no-client    Don't start the client
   --debug        Enable debug logging
   ```

   This script will start all necessary components:
   - Arithmetic Tool
   - Agent
   - Client (unless --no-client is specified)

2. Using Docker:
   ```bash
   docker compose up --build
   ```

## Usage

Send requests to the agent with arithmetic queries like:
- "What is 5 + 3?"
- "Calculate 10 * 7"
- "Divide 100 by 2"
- "What is the sum of 4, 8, and 12?"

## Architecture

This agent uses:
- LangGraph for agent orchestration
- OpenAI models for language processing
- A2A protocol for communication
- Environment variables for configuration

## Components

The system consists of the following main parts:
- **Agent**: A LangGraph-based intelligent agent.
- **MCP Tools**: A collection of tools following the Model Context Protocol, located in the `mcp_tools` directory.
- **A2A Protocol**: Implementation of Google's Agent2Agent protocol for enabling communication between different agents.
- **Client**: A simple client that communicates with the agent using the a2a protocol.

### A2A Protocol

S.O.F.I.A. implements the Agent2Agent (A2A) protocol, an open standard developed by Google that enables seamless communication between AI agents built on different frameworks and by different vendors. Key features include:

- **Agent Discovery**: Agents can discover each other's capabilities and endpoints
- **Task Management**: Unified approach to initiating, tracking, and completing tasks
- **Streaming Support**: Real-time communication through Server-Sent Events (SSE)
- **Structured Messaging**: Support for text, files, and structured data exchanges
- **Push Notifications**: Asynchronous updates through webhook mechanisms

The protocol implementation can be found in `common/a2a/protocol.py`.

### Arithmetic Tool

A simple MCP tool that performs basic arithmetic operations (addition, subtraction, multiplication, division) based on natural language input.

### Agent

A simple agent built with LangGraph that can process messages and use the arithmetic tool to perform calculations.

### Client

A simple client that sends test messages to the agent and displays the responses.

## Project Structure

```
sofia/
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
├── requirements.txt        # Project dependencies (for local setup/dev)
├── README.md               # Project overview and setup
├── docker-compose.yml      # Docker Compose orchestration
├── start.py                # Local development startup script
│
├── agent/                  # Agent Service
│   ├── Dockerfile          # Docker configuration for the agent
│   ├── requirements.txt    # Agent specific dependencies
│   └── src/
│       ├── main.py         # Agent entry point with LangGraph implementation
│
├── mcp_tools/              # MCP Tool Services
│   ├── arithmetic_tool/    # Arithmetic tool service
│   │   ├── Dockerfile      # Docker configuration for arithmetic tool
│   │   ├── requirements.txt # Arithmetic tool dependencies
│   │   └── src/
│   │       ├── tool.py     # Tool logic and MCP implementation
│   │       ├── mcp_client.py # Client for the arithmetic tool
│
├── common/                 # Common utilities and protocols
│   ├── a2a/                # A2A protocol implementation
│   │   ├── protocol.py     # Protocol definitions and utilities
│   │   ├── server/             # Server implementations
│   │   │   ├── server.py       # Base server implementation
│   │   │   ├── task_manager.py # Task manager for handling tasks
│   └── client/             # Client implementations
│       └── client.py       # Client implementation
│
├── clients/                # Test Clients
│   ├── Dockerfile          # Docker configuration for clients
│   ├── requirements.txt    # Client dependencies
│   └── src/
│       ├── client.py       # Simple client implementation using a2a protocol
```

## Testing the Agent

The agent will automatically run through a set of test queries when started:
- "What is 5 + 3?"
- "Calculate 10 * 7"
- "Divide 100 by 2"
- "What is the sum of 4, 8, and 12?"
- "Tell me a joke" (non-arithmetic query)

After running the test queries, you can interact with the agent by typing in the console.

To exit the client, type "exit", "quit", or "q".

## Contributing Guidelines

We welcome contributions to S.O.F.I.A.! To ensure a smooth development process, please follow these guidelines:

### Commit Messages

We use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This allows for automated changelog generation and helps keep the commit history clean and understandable.

Each commit message should consist of a header, a body, and a footer.

- **Header**: The header has a special format that includes a **type**, an optional **scope**, and a **description**:
  ```
  <type>[optional scope]: <description>
  ```
  - **Types**: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`.
  - **Scope**: Optional, specifies the part of the codebase affected (e.g., `agent`, `ui`, `docker`).
  - **Description**: Concise description of the change in the imperative, present tense ("change" not "changed" nor "changes").

- **Body**: Optional, provides additional context about the code changes. Use the imperative, present tense.

- **Footer**: Optional, used for referencing issue tracker IDs (e.g., `Fixes #123`) or noting breaking changes (`BREAKING CHANGE:`).

**Example:**
```
feat(agent): add support for streaming responses

Implement Server-Sent Events (SSE) in the agent service to allow for real-time streaming of responses to the client.

Refs #456
```

### Branching Strategy

We follow a simple feature branch workflow:

1.  **`main` Branch**: This branch represents the latest stable release. Direct commits to `main` are restricted.
2.  **Feature Branches**: Create a new branch for each new feature or bug fix.
    - Name your branch descriptively using the format: `<type>/<short-description>` (e.g., `feat/add-auth-service`, `fix/resolve-arithmetic-bug`).
    - Branch off from the `main` branch.
3.  **Pull Requests (PRs)**: Once your feature or fix is complete:
    - Push your feature branch to the remote repository.
    - Create a Pull Request targeting the `main` branch.
    - Ensure your PR includes a clear description of the changes.
    - Address any feedback or requested changes from reviewers.
4.  **Merging**: Once the PR is approved and passes checks, it will be merged into `main`. Delete your feature branch after merging.

Thank you for contributing!