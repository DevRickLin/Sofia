# S.O.F.I.A. API Documentation

## Table of Contents
1. [A2A Protocol Interfaces](#a2a-protocol-interfaces)
   - [Task Management Interfaces](#task-management-interfaces)
   - [Agent Discovery Interfaces](#agent-discovery-interfaces)
2. [MCP Tool Interfaces](#mcp-tool-interfaces)
   - [Arithmetic Tool Interface](#arithmetic-tool-interface)
   - [Search Tool Interface](#search-tool-interface)
3. [Memory Management Interfaces](#memory-management-interfaces)
4. [Error Handling](#error-handling)

## A2A Protocol Interfaces

The Agent2Agent (A2A) protocol provides standardized interfaces for communication between different agents. These interfaces are based on the JSON-RPC 2.0 specification.

### Task Management Interfaces

#### Send Task Request

**Endpoint**: `/tasks/send`

**Method**: POST

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "method": "tasks/send",
  "params": {
    "id": "task-id-1",
    "sessionId": "session-id-1",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Query content"
        }
      ]
    },
    "historyLength": 10,
    "metadata": {}
  }
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "result": {
    "id": "task-id-1",
    "sessionId": "session-id-1",
    "status": {
      "state": "working",
      "message": null,
      "timestamp": "2023-04-01T12:00:00Z"
    },
    "artifacts": [],
    "history": [],
    "metadata": {}
  }
}
```

#### Send Streaming Task Request

**Endpoint**: `/tasks/send/stream`

**Method**: POST (SSE)

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "method": "tasks/send/stream",
  "params": {
    "id": "task-id-1",
    "sessionId": "session-id-1",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Query content"
        }
      ]
    },
    "historyLength": 10,
    "metadata": {}
  }
}
```

**Response Format** (SSE event sequence):
```
event: status
data: {"id":"task-id-1","status":{"state":"working","timestamp":"2023-04-01T12:00:01Z"},"final":false}

event: artifact
data: {"id":"task-id-1","artifact":{"parts":[{"type":"text","text":"Processing..."}]}}

event: status
data: {"id":"task-id-1","status":{"state":"completed","timestamp":"2023-04-01T12:00:10Z"},"final":true}
```

#### Get Task Status

**Endpoint**: `/tasks/${taskId}`

**Method**: GET

**Response Format**:
```json
{
  "id": "task-id-1",
  "sessionId": "session-id-1",
  "status": {
    "state": "completed",
    "message": {
      "role": "agent",
      "parts": [
        {
          "type": "text",
          "text": "The calculation result is 42."
        }
      ]
    },
    "timestamp": "2023-04-01T12:00:10Z"
  },
  "artifacts": [],
  "history": [],
  "metadata": {}
}
```

### Agent Discovery Interfaces

#### Get Agent Card Information

**Endpoint**: `/agent-card`

**Method**: GET

**Response Format**:
```json
{
  "name": "SOFIA General Agent",
  "description": "A versatile agent with various capabilities provided by MCP servers",
  "url": "http://host:port",
  "version": "0.1.0",
  "skills": [
    {
      "id": "general",
      "name": "General Assistant",
      "description": "Handle various tasks through MCP server tools",
      "examples": [
        "Perform calculations",
        "Get information from different sources",
        "Execute specialized tasks",
        "Use various integrated tools"
      ]
    }
  ]
}
```

## MCP Tool Interfaces

MCP (Model Context Protocol) tools expose their functionality through standardized interfaces, allowing agents to call these tools to perform specific tasks.

### Arithmetic Tool Interface

#### Calculate Expression

**Tool Name**: `calculate`

**Input**:
```json
{
  "expression": "add 5 and 10"
}
```

**Output**:
```json
{
  "result": 15,
  "operation": "add",
  "numbers": [5, 10]
}
```

### Search Tool Interface

#### Guide User for Detailed Information

**Tool Name**: `guide_user_detail`

**Input**:
```json
{
  "query": "artificial intelligence"
}
```

**Output**:
```
To better help you find information about artificial intelligence, I have a few questions:
1. Are you looking to understand the basic concepts of AI or its latest developments?
2. Which specific area of AI are you interested in? For example, machine learning, natural language processing, or computer vision?
3. Are you exploring this topic for academic purposes, career development, or personal interest?
4. Would you prefer basic introductory information or in-depth technical details?
```

#### Split Query into Multiple Dimensions

**Tool Name**: `split_query_to_dimension`

**Input**:
```json
{
  "query": "What is reinforcement learning and its applications"
}
```

**Output**:
```json
{
  "dimensions": [
    {
      "name": "Concept Definition",
      "query": "What are the basic concepts and principles of reinforcement learning",
      "explanation": "Understanding core definitions and fundamental theories of reinforcement learning"
    },
    {
      "name": "Working Mechanism",
      "query": "How reinforcement learning works and its algorithms",
      "explanation": "Exploring how reinforcement learning learns through reward mechanisms"
    },
    {
      "name": "Application Areas",
      "query": "Practical application areas and cases of reinforcement learning",
      "explanation": "Researching applications of reinforcement learning in games, robotics, autonomous driving, etc."
    }
  ]
}
```

#### Web Search

**Tool Name**: `search_web`

**Input**:
```json
{
  "query": "Latest advances in artificial intelligence in 2023"
}
```

**Output**:
```json
[
  {
    "url": "https://example.com/ai-advances-2023",
    "id": "result-1",
    "title": "Major Breakthroughs in Artificial Intelligence in 2023",
    "score": 0.95,
    "publishedDate": "2023-03-15",
    "author": "AI Research Team",
    "text": "In 2023, the field of artificial intelligence achieved several major breakthroughs...(content omitted)",
    "summary": "This article summarizes the main advances in artificial intelligence in 2023, including improvements in large language models, the development of multimodal AI, and breakthroughs in AI applications in healthcare and climate science."
  },
  {
    "url": "https://example.org/ai-trends-2023",
    "id": "result-2",
    "title": "AI Trends Analysis for 2023",
    "score": 0.89,
    "publishedDate": "2023-02-20",
    "author": "Technology Analyst",
    "text": "With the continuous improvement of computing power and algorithm optimization...(content omitted)",
    "summary": "The article analyzes the main AI trends in 2023, highlighting AI democratization, the rise of domain-specific models, and the development of AI ethical standards."
  }
]
```

## Memory Management Interfaces

The Sofia system provides memory management interfaces for storing, retrieving, and managing user memories.

### Add User Memory

**Method**: `add_user_memory`

**Input**:
```python
{
  "content": "User enjoys technology-related topics",
  "user_id": "user-123",
  "topics": ["interests", "preferences", "technology"]
}
```

**Output**:
```python
"memory-456" # Memory ID
```

### Retrieve User Memories

**Method**: `search_user_memories`

**Input**:
```python
{
  "query": "What topics is the user interested in",
  "user_id": "user-123",
  "limit": 5
}
```

**Output**:
```python
[
  {
    "id": "memory-456",
    "memory": "User enjoys technology-related topics",
    "topics": ["interests", "preferences", "technology"],
    "relevance": 0.95
  },
  # More memories...
]
```

### Delete User Memory

**Method**: `delete_user_memory`

**Input**:
```python
{
  "user_id": "user-123",
  "memory_id": "memory-456"
}
```

**Output**:
```python
True # Deletion successful
```

## Error Handling

S.O.F.I.A API follows standard error handling mechanisms, especially adhering to the JSON-RPC 2.0 error specification.

### Standard Error Codes

| Error Code | Error Message | Description |
|---------|---------|------|
| -32700 | Invalid JSON payload | Invalid JSON payload |
| -32600 | Request payload validation error | Request payload validation error |
| -32601 | Method not found | Method not found |
| -32602 | Invalid parameters | Invalid parameters |
| -32603 | Internal error | Internal error |

### Error Response Example

```json
{
  "jsonrpc": "2.0",
  "id": "request-id-1",
  "error": {
    "code": -32602,
    "message": "Invalid parameters",
    "data": {
      "details": "Missing required parameter: query"
    }
  }
}
``` 