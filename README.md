# S.O.F.I.A.

<p align="center">
  <img src="ui/web2/imgs/sofia_logo.png" alt="Sofia Logo" width="400">
</p>

**Sofia: Turn Chaos into Clarity in Just a Few Clicks**

Sofia transforms how you research, learn, and organize information by turning scattered content into visual knowledge maps that make sense.

## What Makes Sofia Different

- **Smart Visual Maps:** Turns complex information into interactive knowledge maps instead of endless text
- **Organized Conversations:** Each topic gets its own thread - no more scrolling through mixed conversations
- **Automatic Updates:** Tracks topics you care about and adds new information to your maps automatically
- **Focused Insights:** Quickly see what matters with AI-generated summaries for each information node

## Search Functionality Description

S.O.F.I.A. now includes Google search functionality using SerpApi, which can perform web searches based on user input keywords to obtain real-time information.

### Search Features

1. Google Search Support: Perform Google searches through SerpApi's API to obtain real-time web information
2. Structured Results Extraction: Automatically extract structured information such as titles, links, and summaries from search results
3. Knowledge Graph Support: Extract relevant information from Google Knowledge Graph
4. Flexible Parameter Configuration: Support for customizing result quantity, search location, and other parameters

### Usage Instructions

1. First, you need to configure the SerpApi API key in the `.env` file:

   ```
   SERPAPI_KEY=your_serpapi_key_here
   ```
2. Using search functionality in code:

   ```python
   from mcp_tools.arithmetic_tool.algorithm.queryTree import Spider

   # Create Spider instance
   spider = Spider()

   # Perform search
   search_results = spider.google_search("latest artificial intelligence technologies")

   # Extract structured results
   structured_results = spider.extract_search_results(search_results)

   # Process search results
   for result in structured_results:
       print(f"Title: {result['title']}")
       print(f"Link: {result['link']}")
       print(f"Summary: {result['snippet']}")
       print("---")
   ```
3. Or use the `crawl_node` method to directly get node information:

   ```python
   node = spider.crawl_node("latest artificial intelligence technologies")
   if node:
       print(f"URL: {node.node_url}")
       print(f"Abstract: {node.node_abstract}")
   ```

### Important Notes

- A valid SerpApi API key must be set before use
- SerpApi is a paid service, please be aware of API usage quotas
- Search results may be affected by region and language settings

## Overview

S.O.F.I.A. is a agent system built with the following technologies:

- [LangGraph](https://github.com/langchain-ai/langgraph) for agent workflow
- [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) for tool management
- [Agent2Agent Protocol (A2A)](https://github.com/google/A2A) for agent communication and interoperability

## Article Quality Assessment

The system also includes an article quality assessment tool that evaluates text content using advanced LLM prompting. This feature:

1. Uses sophisticated prompts to analyze articles on 12 different dimensions:

   - Text Coherence
   - Argument Completeness
   - Language Quality
   - Information Density
   - Structural Reasonability
   - Terminology Usage
   - Content Uniqueness
   - Depth of Analysis
   - Internal Consistency
   - Reasoning Quality
   - Contextual Understanding
   - Text Complexity Balance
2. Provides comprehensive evaluation including:

   - Detailed scores for each dimension
   - Analysis of the article's strengths and weaknesses
   - General evaluation of the content quality
3. Environment Requirements:

   - The feature requires an OpenAI API key to be set in your environment
   - Uses the LLM model specified in your .env file (defaults to gpt-3.5-turbo)

## Setup

1. Clone this repository
2. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   For UI dependencies:
   ```bash
   cd ui/web
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

   * Ensure ports and service names match your `docker-compose.yml` configuration (e.g., `agent-service` runs on `8001`, `arithmetic-tool` on `5001`).
   * Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Running the Project

### Using Unified Startup Script (Recommended)

S.O.F.I.A. now includes a unified startup script that can start all required services:

```bash
# Start with CLI UI (default)
python script/start.py

# Start with Web UI
python script/start.py --ui web

# Enable debug logging
python script/start.py --debug
```

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
- **Common Utilities (`common/`)**: Includes shared code, such as the A2A protocol implementation.
- **CLI Client (`ui/cli`)**: Example command-line client for interacting with services.
- **Web UI (`ui/web`)**: The frontend application (Next.js based).
- **Debug Server (`debug_server.py`)**: Local development server for testing.

### A2A Protocol

S.O.F.I.A. implements the Agent2Agent (A2A) protocol, an open standard developed by Google that enables seamless communication between AI agents built on different frameworks and by different vendors. Key features include:

- **Agent Discovery**: Agents can discover each other's capabilities and endpoints
- **Task Management**: Unified approach to initiating, tracking, and completing tasks
- **Streaming Support**: Real-time communication through Server-Sent Events (SSE)
- **Structured Messaging**: Support for text, files, and structured data exchanges
- **Push Notifications**: Asynchronous updates through webhook mechanisms

The protocol implementation can be found in `common/a2a/`.

### Arithmetic Tool

Located in `services/agent-service/mcp_tools/arithmetic_tool`. A simple MCP tool that performs basic arithmetic operations (addition, subtraction, multiplication, division) based on natural language input.

### Agent

Located in `services/agent-service/agent`. A simple agent built with LangGraph that can process messages and use the arithmetic tool to perform calculations.

### Client

Example CLI client is located in `ui/cli`.

## Project Structure

```
sofia/
├── .gitignore              # Git ignore rules
├── README.md               # Project overview and setup
├── debug_server.py         # Local development debug server
├── requirements.txt        # Root dependencies for all project components
├── script/                 # Unified startup scripts
│   ├── README.md           # Script documentation
│   └── start.py            # Main startup script
│
├── common/                 # Shared Python code (moved to root level)
│   ├── __init__.py
│   └── a2a/                # A2A Protocol implementation
│       ├── ...
│
├── services/
│   ├── agent-service/        # Primary backend service
│   │   ├── .env.example      # Environment variables for agent-service
│   │   ├── README.md         # Agent service documentation
│   │   │
│   │   ├── agent/            # Core Agent logic
│   │   │   └── src/main.py
│   │   │
│   │   └── mcp_tools/        # MCP Tools
│   │       └── arithmetic_tool/
│   │           └── src/
│   │               ├── tool.py
│   │               └── mcp_client.py
│
└── ui/
    ├── cli/                  # Command-line client
    │   └── src/client.py
    │
    └── web/                  # Frontend Web UI (Next.js)
        ├── package.json
        ├── next.config.ts
        ├── public/
        └── src/
            ├── pages/
            └── styles/

```

*(Note: The structure above is simplified.)*

## Contribution

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

1. **`main` Branch**: This branch represents the latest stable release. Direct commits to `main` are restricted.
2. **Feature Branches**: Create a new branch for each new feature or bug fix.
   - Name your branch descriptively using the format: `<type>/<short-description>` (e.g., `feat/add-auth-service`, `fix/resolve-arithmetic-bug`).
   - Branch off from the `main` branch.
3. **Pull Requests (PRs)**: Once your feature or fix is complete:
   - Push your feature branch to the remote repository.
   - Create a Pull Request targeting the `main` branch.
   - Ensure your PR includes a clear description of the changes.
   - Address any feedback or requested changes from reviewers.
4. **Merging**: Once the PR is approved and passes checks, it will be merged into `main`. Delete your feature branch after merging.
