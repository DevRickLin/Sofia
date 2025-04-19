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
2. **Navigate to Service/UI Directories:** Dependencies are managed within each service/UI directory.
   ```bash
   cd services/agent-service
   pip install -r requirements.txt
   cd ../../ui/web
   npm install
   cd ../.. # Return to root
   ```
3. **Configure Environment Variables:** Copy `.env.example` within `services/agent-service` to `.env` and configure it:
   ```bash
   cp services/agent-service/.env.example services/agent-service/.env
   # Now edit services/agent-service/.env
   ```
   Example structure within `services/agent-service/.env`:
   ```dotenv
   # Agent Service Configuration (Example - Adjust as needed)
   # A2A_SERVER_HOST=0.0.0.0 # Often managed by Docker/runtime
   # A2A_SERVER_PORT=8001    # Port exposed by agent-service

   # External Services (within Docker network)
   ARITHMETIC_TOOL_URL=http://arithmetic-tool:5001 # Example service name and port
   REDIS_HOST=redis
   REDIS_PORT=6379

   # API Keys
   OPENAI_API_KEY=your_openai_api_key_here

   # Model Configuration
   LLM_MODEL=gpt-3.5-turbo
   ```
   *   Ensure ports and service names match your `docker-compose.yml` configuration (e.g., `agent-service` runs on `8001`, `arithmetic-tool` on `5001`).
   *   Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Running the Project

You can run S.O.F.I.A. using Docker Compose (Recommended):

```bash
docker compose up --build
```
This command will build and start all the services defined in `docker-compose.yml` (Redis, Agent Service, Arithmetic Tool, Web UI, etc.).

*(Note: The previous `start.py` script is now located within `services/agent-service` and might require adjustments to run standalone outside of Docker.)*

## Usage

Interact with the system via the Web UI (typically running on `http://localhost:3000`) or potentially through direct API calls if the gateway service is configured.

Example arithmetic queries for the agent:
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

The system consists of the following main parts within their respective directories:

- **Agent Service (`services/agent-service/agent`)**: A LangGraph-based intelligent agent.
- **MCP Tools (`services/agent-service/mcp_tools`)**: Contains tools like the Arithmetic Tool.
- **Common Utilities (`services/agent-service/common`)**: Includes shared code, such as the A2A protocol implementation.
- **Test Clients (`services/agent-service/clients`)**: Example clients for interacting with services.
- **Web UI (`ui/web`)**: The frontend application (Next.js based).

### A2A Protocol

S.O.F.I.A. implements the Agent2Agent (A2A) protocol, an open standard developed by Google that enables seamless communication between AI agents built on different frameworks and by different vendors. Key features include:

- **Agent Discovery**: Agents can discover each other's capabilities and endpoints
- **Task Management**: Unified approach to initiating, tracking, and completing tasks
- **Streaming Support**: Real-time communication through Server-Sent Events (SSE)
- **Structured Messaging**: Support for text, files, and structured data exchanges
- **Push Notifications**: Asynchronous updates through webhook mechanisms

The protocol implementation can be found in `services/agent-service/common/a2a/`.

### Arithmetic Tool

Located in `services/agent-service/mcp_tools/arithmetic_tool`. A simple MCP tool that performs basic arithmetic operations (addition, subtraction, multiplication, division) based on natural language input.

### Agent

Located in `services/agent-service/agent`. A simple agent built with LangGraph that can process messages and use the arithmetic tool to perform calculations.

### Client

Example clients are located in `services/agent-service/clients`.

## Project Structure

```
sofia/
├── .gitignore              # Git ignore rules
├── README.md               # Project overview and setup
├── docker-compose.yml      # Docker Compose orchestration
│
├── services/
│   ├── agent-service/        # Primary backend service
│   │   ├── .env.example      # Environment variables for agent-service
│   │   ├── requirements.txt  # Root dependencies for agent-service Python parts
│   │   ├── start.py          # Local development startup script (might need updates)
│   │   │
│   │   ├── agent/            # Core Agent logic
│   │   │   ├── Dockerfile
│   │   │   ├── requirements.txt
│   │   │   └── src/main.py
│   │   │
│   │   ├── clients/          # Example clients
│   │   │   ├── Dockerfile
│   │   │   ├── requirements.txt
│   │   │   └── src/client.py
│   │   │
│   │   ├── common/           # Shared Python code
│   │   │   ├── __init__.py
│   │   │   └── a2a/          # A2A Protocol implementation
│   │   │       ├── ...
│   │   │
│   │   └── mcp_tools/        # MCP Tools
│   │       └── arithmetic_tool/
│   │           ├── Dockerfile
│   │           ├── requirements.txt
│   │           └── src/
│   │               ├── tool.py
│   │               └── mcp_client.py
│   │
│   └── (Other potential services like gateway-service, tool-execution-service...) # If added
│
└── ui/
    └── web/                  # Frontend Web UI (Next.js)
        ├── Dockerfile
        ├── package.json
        ├── next.config.ts
        ├── public/
        └── src/
            ├── pages/
            └── styles/

```
*(Note: The structure above is simplified. Refer to `docker-compose.yml` for the definitive list of services and their configurations.)*

## Testing the Agent

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