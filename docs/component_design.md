# S.O.F.I.A. Component Design Document

## Table of Contents
1. [Overview](#overview)
2. [Frontend Components](#frontend-components)
   - [Web Interface](#web-interface)
   - [CLI Interface](#cli-interface)
3. [Service Layer Components](#service-layer-components)
   - [Agent Service](#agent-service)
   - [A2A Server](#a2a-server)
   - [Task Manager](#task-manager)
4. [Tool Components](#tool-components)
   - [Arithmetic Tool](#arithmetic-tool)
   - [Search Tool](#search-tool)
5. [Data Storage Components](#data-storage-components)
   - [Memory Storage](#memory-storage)
   - [Session Storage](#session-storage)
6. [Common Components](#common-components)
   - [A2A Protocol Implementation](#a2a-protocol-implementation)
   - [MCP Configuration Management](#mcp-configuration-management)
7. [Component Interactions](#component-interactions)

## Overview

The S.O.F.I.A. system adopts a modular design, composed of multiple independent components, each responsible for specific functions. Components communicate through well-defined interfaces, ensuring loose coupling, maintainability, and extensibility.

## Frontend Components

### Web Interface

**Location**: `ui/web`

**Technology Stack**: Next.js, React, TypeScript, Tailwind CSS

**Main Responsibilities**:
- Provide a user-friendly graphical interface
- Handle user input
- Display agent responses
- Manage user sessions

**Key Components**:

1. **ChatInterface** (`src/components/Chat/`):
   - Handle message input and display
   - Support streaming responses
   - Manage chat history

2. **A2AClient** (`src/api/a2aClient.ts`):
   - Implement A2A protocol client
   - Handle communication with agent services

3. **State Management** (`src/stores/`):
   - Maintain application state using state management libraries
   - Manage sessions, messages, and user preferences

**Design Considerations**:
- Responsive design, adapting to different devices
- Component-based architecture for reuse and testing
- Support for streaming responses to improve user experience
- Clear state management to ensure UI consistency

### CLI Interface

**Location**: `ui/cli`

**Technology Stack**: Python

**Main Responsibilities**:
- Provide command-line interface
- Handle user commands and queries
- Display agent responses
- Support simple script automation

**Key Components**:

1. **Client Class** (`src/client.py`):
   - Handle command-line arguments
   - Implement A2A protocol client
   - Handle communication with agent services

2. **CommandProcessor**:
   - Parse user commands
   - Call corresponding A2A client methods
   - Handle command-line output formatting

**Design Considerations**:
- Simple and intuitive command format
- Good error handling and user feedback
- Support for interactive and batch processing modes
- Minimal dependencies, easy to install and use

## Service Layer Components

### Agent Service

**Location**: `services/agent-service/agent`

**Technology Stack**: Python, LangGraph, OpenAI API

**Main Responsibilities**:
- Process and understand user queries
- Manage user memories and history
- Coordinate and call MCP tools
- Generate responses

**Key Components**:

1. **SofiaAgent Class** (`src/main.py`):
   - Initialize and manage LLM models
   - Process user messages
   - Coordinate tool calls
   - Manage memory storage
   - Generate replies

2. **Memory Management Methods**:
   - `add_user_memory`
   - `delete_user_memory`
   - `replace_user_memory`
   - `search_user_memories`
   - `clear_all_memories`

3. **Response Processing Methods**:
   - `invoke`: Handle single responses
   - `stream`: Handle streaming responses

**Design Considerations**:
- Configurable LLM model selection
- Robust error handling
- Flexible tool integration
- Efficient memory management
- Support for streaming processing

### A2A Server

**Location**: `common/server/server.py`

**Technology Stack**: Python, FastAPI, SSE

**Main Responsibilities**:
- Handle A2A requests from clients
- Forward requests to Agent for processing
- Manage SSE connections
- Handle task lifecycle

**Key Components**:

1. **A2AServer Class**:
   - Set up FastAPI application
   - Register request handling routes
   - Manage SSE connections
   - Handle A2A protocol messages

2. **Route Handlers**:
   - `/agent-card`: Return agent card information
   - `/tasks/send`: Handle task requests
   - `/tasks/send/stream`: Handle streaming task requests
   - `/tasks/{task_id}`: Get task status

**Design Considerations**:
- Compliance with A2A protocol specifications
- Efficient asynchronous processing
- Robust error handling
- Support for long connections and SSE

### Task Manager

**Location**: `common/server/task_manager.py`

**Technology Stack**: Python

**Main Responsibilities**:
- Create and track tasks
- Update task status
- Store task history
- Manage task lifecycle

**Key Components**:

1. **TaskManager Class**:
   - `create_task`: Create new tasks
   - `update_task_status`: Update task status
   - `get_task`: Get task information
   - `add_artifact`: Add task artifacts
   - `add_message_to_history`: Update task history

2. **Internal Storage**:
   - Use memory or persistent storage for task information
   - Maintain task indexing and query capabilities

**Design Considerations**:
- Thread-safe operations
- Efficient task querying
- Support for persistent storage options
- Clear error handling

## Tool Components

### Arithmetic Tool

**Location**: `services/mcp-service/arithmetic/arithmetic_server.py`

**Technology Stack**: Python, FastMCP

**Main Responsibilities**:
- Parse arithmetic expressions
- Perform basic mathematical operations
- Return structured results

**Key Components**:

1. **Calculation Functions**:
   - `calculate`: Parse and calculate expressions
   - `parse_arithmetic_expression`: Extract operations and numbers from text

**Design Considerations**:
- Support for natural language expressions
- Robust error handling
- Structured result output
- Support for various operation types

### Search Tool

**Location**: `services/mcp-service/search/search_server.py`

**Technology Stack**: Python, FastMCP, Exa/SerpApi

**Main Responsibilities**:
- Perform web searches
- Extract and structure search results
- Generate result summaries
- Guide users to provide detailed information

**Key Components**:

1. **Search Functions**:
   - `search_web`: Perform web searches
   - `guide_user_detail`: Guide users to provide detailed information
   - `split_query_to_dimension`: Split queries into multiple dimensions

2. **Result Processing Functions**:
   - `_get_summary`: Generate search result summaries
   - `talk_llm`: Interact with LLM

**Design Considerations**:
- Support for multiple search providers
- Structured result format
- Intelligent summary generation
- User query guidance and optimization

## Data Storage Components

### Memory Storage

**Technology Stack**: SQLite, Agno Memory

**Main Responsibilities**:
- Store user memories
- Provide semantic search
- Manage memory lifecycle
- Support memory updates and deletions

**Key Components**:

1. **Memory Class**:
   - SQLite-based persistent storage
   - Support for semantic search and topic-based queries
   - Provide CRUD operations for memories

2. **UserMemory Model**:
   - Store memory content
   - Associate topic tags
   - Maintain metadata

**Design Considerations**:
- Efficient semantic search
- Support for persistent storage
- Flexible query capabilities
- Clear data model

### Session Storage

**Technology Stack**: SQLite

**Main Responsibilities**:
- Store session state
- Maintain session history
- Support session recovery

**Key Components**:

1. **SqliteStorage Class**:
   - Provide session storage and retrieval
   - Support session state updates
   - Maintain session history records

**Design Considerations**:
- Efficient storage and retrieval
- Support for large numbers of sessions
- Session data consistency
- Secure data handling

## Common Components

### A2A Protocol Implementation

**Location**: `common/a2a/protocol.py`

**Technology Stack**: Python, Pydantic

**Main Responsibilities**:
- Define A2A protocol data models
- Provide serialization and deserialization functionality
- Support protocol validation

**Key Components**:

1. **Protocol Data Models**:
   - `Message`: Messages exchanged between agents
   - `Task`: Task representation
   - `TaskStatus`: Task status
   - `AgentCard`: Agent metadata
   - `AgentSkill`: Agent capabilities

2. **JSON-RPC Models**:
   - `JSONRPCRequest`: JSON-RPC request
   - `JSONRPCResponse`: JSON-RPC response
   - `JSONRPCError`: Error handling

**Design Considerations**:
- Compliance with A2A protocol specifications
- Strong type validation
- Easy to extend
- Good error handling

### MCP Configuration Management

**Location**: `common/mcp_config.py`

**Technology Stack**: Python

**Main Responsibilities**:
- Manage MCP server configurations
- Provide tool command generation
- Support tool discovery

**Key Components**:

1. **Configuration Dictionary**:
   - `MCP_SERVERS`: Store server configurations
   - Include tool commands, parameters, and transport types

**Design Considerations**:
- Centralized configuration management
- Flexible tool definitions
- Support for multiple tool types
- Easy to extend with new tools

## Component Interactions

1. **User-Frontend Interaction**:
   - Users input queries through Web or CLI interfaces
   - Frontend components process input and create A2A tasks
   - Frontend receives responses and displays them to users

2. **Frontend-Service Layer Interaction**:
   - Frontend sends task requests via A2A protocol
   - A2A server receives requests and forwards them to Agent
   - Agent processes requests and returns responses
   - Task manager tracks task status and lifecycle

3. **Agent-Tool Interaction**:
   - Agent decides it needs to call a tool
   - Calls the appropriate tool via MCP protocol
   - Tool executes operations and returns results
   - Agent integrates tool results to generate responses

4. **Agent-Storage Interaction**:
   - Agent queries memory storage for relevant information
   - Agent updates memory storage to add new memories
   - Session storage maintains session state and history

5. **Tool-External Service Interaction**:
   - Search tool calls external search APIs
   - Tool processes and transforms external API results
   - Tool returns structured data to Agent 