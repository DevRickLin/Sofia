# S.O.F.I.A. API接口文档

## 目录
1. [A2A协议接口](#a2a协议接口)
   - [任务管理接口](#任务管理接口)
   - [代理发现接口](#代理发现接口)
2. [MCP工具接口](#mcp工具接口)
   - [算术工具接口](#算术工具接口)
   - [搜索工具接口](#搜索工具接口)
3. [内存管理接口](#内存管理接口)
4. [错误处理](#错误处理)

## A2A协议接口

Agent2Agent (A2A) 协议提供了标准化的接口，用于不同代理之间的通信。这些接口基于JSON-RPC 2.0规范。

### 任务管理接口

#### 发送任务请求

**端点**: `/tasks/send`

**方法**: POST

**请求格式**:
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
          "text": "查询内容"
        }
      ]
    },
    "historyLength": 10,
    "metadata": {}
  }
}
```

**响应格式**:
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

#### 发送流式任务请求

**端点**: `/tasks/send/stream`

**方法**: POST (SSE)

**请求格式**:
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
          "text": "查询内容"
        }
      ]
    },
    "historyLength": 10,
    "metadata": {}
  }
}
```

**响应格式** (SSE事件序列):
```
event: status
data: {"id":"task-id-1","status":{"state":"working","timestamp":"2023-04-01T12:00:01Z"},"final":false}

event: artifact
data: {"id":"task-id-1","artifact":{"parts":[{"type":"text","text":"处理中..."}]}}

event: status
data: {"id":"task-id-1","status":{"state":"completed","timestamp":"2023-04-01T12:00:10Z"},"final":true}
```

#### 获取任务状态

**端点**: `/tasks/${taskId}`

**方法**: GET

**响应格式**:
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
          "text": "计算结果是42。"
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

### 代理发现接口

#### 获取代理卡片信息

**端点**: `/agent-card`

**方法**: GET

**响应格式**:
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

## MCP工具接口

MCP（Model Context Protocol）工具通过标准化接口暴露其功能，使代理能够调用这些工具执行特定任务。

### 算术工具接口

#### 计算表达式

**工具名称**: `calculate`

**输入**:
```json
{
  "expression": "add 5 and 10"
}
```

**输出**:
```json
{
  "result": 15,
  "operation": "add",
  "numbers": [5, 10]
}
```

### 搜索工具接口

#### 引导用户提供详细信息

**工具名称**: `guide_user_detail`

**输入**:
```json
{
  "query": "人工智能"
}
```

**输出**:
```
为了更好地帮助您查找关于人工智能的信息，我有几个问题：
1. 您是想了解人工智能的基本概念还是最新发展？
2. 您对人工智能的哪个具体领域感兴趣？例如，机器学习、自然语言处理或计算机视觉？
3. 您是出于学术目的、职业发展还是个人兴趣在了解这个话题？
4. 您希望获得基础入门级的信息还是深入的技术细节？
```

#### 将查询分解为多个维度

**工具名称**: `split_query_to_dimension`

**输入**:
```json
{
  "query": "什么是强化学习以及它的应用"
}
```

**输出**:
```json
{
  "dimensions": [
    {
      "name": "概念定义",
      "query": "强化学习的基本概念和原理是什么",
      "explanation": "了解强化学习的核心定义和基础理论"
    },
    {
      "name": "工作机制",
      "query": "强化学习的工作机制和算法",
      "explanation": "探索强化学习如何通过奖励机制进行学习"
    },
    {
      "name": "应用领域",
      "query": "强化学习的实际应用领域和案例",
      "explanation": "研究强化学习在游戏、机器人、自动驾驶等领域的应用"
    }
  ]
}
```

#### 网络搜索

**工具名称**: `search_web`

**输入**:
```json
{
  "query": "2023年人工智能的最新进展"
}
```

**输出**:
```json
[
  {
    "url": "https://example.com/ai-advances-2023",
    "id": "result-1",
    "title": "2023年人工智能领域的重大突破",
    "score": 0.95,
    "publishedDate": "2023-03-15",
    "author": "AI研究团队",
    "text": "2023年，人工智能领域取得了多项重大突破...(内容省略)",
    "summary": "本文总结了2023年人工智能领域的主要进展，包括大型语言模型的改进、多模态AI的发展以及AI在医疗和气候科学中的应用突破。"
  },
  {
    "url": "https://example.org/ai-trends-2023",
    "id": "result-2",
    "title": "2023年AI趋势分析",
    "score": 0.89,
    "publishedDate": "2023-02-20",
    "author": "技术分析师",
    "text": "随着计算能力的不断提升和算法的优化...(内容省略)",
    "summary": "文章分析了2023年AI的主要趋势，强调了AI民主化、特定领域模型的崛起以及AI伦理标准的发展。"
  }
]
```

## 内存管理接口

Sofia系统提供内存管理接口，用于存储、检索和管理用户记忆。

### 添加用户记忆

**方法**: `add_user_memory`

**输入**:
```python
{
  "content": "用户喜欢科技相关话题",
  "user_id": "user-123",
  "topics": ["兴趣", "偏好", "科技"]
}
```

**输出**:
```python
"memory-456" # 记忆ID
```

### 检索用户记忆

**方法**: `search_user_memories`

**输入**:
```python
{
  "query": "用户对什么话题感兴趣",
  "user_id": "user-123",
  "limit": 5
}
```

**输出**:
```python
[
  {
    "id": "memory-456",
    "memory": "用户喜欢科技相关话题",
    "topics": ["兴趣", "偏好", "科技"],
    "relevance": 0.95
  },
  # 更多记忆...
]
```

### 删除用户记忆

**方法**: `delete_user_memory`

**输入**:
```python
{
  "user_id": "user-123",
  "memory_id": "memory-456"
}
```

**输出**:
```python
True # 删除成功
```

## 错误处理

S.O.F.I.A API遵循标准的错误处理机制，特别是遵循JSON-RPC 2.0的错误规范。

### 标准错误代码

| 错误代码 | 错误消息 | 说明 |
|---------|---------|------|
| -32700 | Invalid JSON payload | 无效的JSON负载 |
| -32600 | Request payload validation error | 请求负载验证错误 |
| -32601 | Method not found | 找不到方法 |
| -32602 | Invalid parameters | 无效的参数 |
| -32603 | Internal error | 内部错误 |

### 错误响应示例

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