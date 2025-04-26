# 🌐 S.O.F.I.A.
**Search-Oriented Functional Intelligence Agent**

> A modular, search-centric AI agent framework designed to integrate structured information flow and intelligent decision-making.

## 搜索功能说明

S.O.F.I.A. 现在包含使用SerpApi进行Google搜索的功能，可以基于用户输入的关键词进行网络搜索，获取实时信息。

### 搜索功能特点

1. 支持Google搜索：通过SerpApi提供的API进行Google搜索，获取实时网络信息
2. 提取结构化结果：自动提取搜索结果的标题、链接和摘要等信息
3. 支持知识图谱：提取Google知识图谱中的相关信息
4. 灵活的参数配置：支持自定义结果数量、搜索位置等参数

### 使用方法

1. 首先需要在 `.env` 文件中配置SerpApi的API密钥：
   ```
   SERPAPI_KEY=your_serpapi_key_here
   ```

2. 在代码中使用搜索功能：
   ```python
   from mcp_tools.arithmetic_tool.algorithm.queryTree import Spider
   
   # 创建Spider实例
   spider = Spider()
   
   # 进行搜索
   search_results = spider.google_search("人工智能最新技术")
   
   # 提取结构化结果
   structured_results = spider.extract_search_results(search_results)
   
   # 处理搜索结果
   for result in structured_results:
       print(f"标题: {result['title']}")
       print(f"链接: {result['link']}")
       print(f"摘要: {result['snippet']}")
       print("---")
   ```

3. 或者使用`crawl_node`方法直接获取节点信息：
   ```python
   node = spider.crawl_node("人工智能最新技术")
   if node:
       print(f"URL: {node.node_url}")
       print(f"摘要: {node.node_abstract}")
   ```

### 注意事项

- 使用前必须设置有效的SerpApi API密钥
- SerpApi是一个付费服务，请注意API使用配额
- 搜索结果可能受到地区和语言设置的影响

## Overview

S.O.F.I.A. is a agent system built with the following technologies:
- [LangGraph](https://github.com/langchain-ai/langgraph) for agent workflow
- [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) for tool management
- [Agent2Agent Protocol (A2A)](https://github.com/google/A2A) for agent communication and interoperability

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
   *   Ensure ports and service names match your `docker-compose.yml` configuration (e.g., `agent-service` runs on `8001`, `arithmetic-tool` on `5001`).
   *   Replace `your_openai_api_key_here` with your actual OpenAI API key.

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