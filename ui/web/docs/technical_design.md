# Knowledge Base Application Technical Design Document

## Overview

This document outlines the technical design for a dialogue-based knowledge base application featuring a chat interface and a graph visualization canvas. The application allows users to interact with an agent through a chat interface while visualizing knowledge entities and their relationships in a graph canvas.

## Architecture

### High-Level Architecture

The application follows a client-server architecture:

- **Frontend**: React-based web application with two main interfaces:
  - Left panel: Chat interface for agent conversation
  - Right panel: Canvas interface for knowledge graph visualization
  
- **State Management**: Two separate Zustand stores:
  - `chatStore`: Manages conversation state and interactions
  - `canvasStore`: Manages graph visualization state
  
- **Backend Communication**:
  - A2A-inspired API for chat functionality
  - Atomic API for graph canvas operations

### Technical Stack

- **Frontend Framework**: Next.js
- **State Management**: Zustand
- **Graph Visualization**: React Flow
- **Styling**: Tailwind CSS
- **API Communication**: Axios

## State Management

### Chat Store (A2A-inspired)

The chat store follows the Agent-to-Agent (A2A) protocol's task-based communication model:

```typescript
interface ChatState {
  // Core state
  taskId: string | null;
  messages: Message[];
  status: 'idle' | 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
  artifacts: Artifact[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  initializeTask: () => void;
  sendMessage: (content: string) => Promise<void>;
  cancelTask: () => Promise<void>;
  resetChat: () => void;
}

interface Message {
  role: 'user' | 'agent';
  parts: MessagePart[];
  timestamp: string;
}

type MessagePart = TextPart | FilePart | DataPart;

interface TextPart {
  type: 'text';
  content: string;
}

interface FilePart {
  type: 'file';
  mimeType: string;
  data: string | { uri: string };
  filename?: string;
}

interface DataPart {
  type: 'data';
  mimeType: 'application/json';
  data: any;
}

interface Artifact {
  id: string;
  parts: MessagePart[];
}
```

### Canvas Store (Graph-based)

The canvas store manages the knowledge graph visualization:

```typescript
interface CanvasState {
  // Core state
  nodes: Node[];
  edges: Edge[];
  selectedElements: { nodes: string[], edges: string[] };
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchGraph: () => Promise<void>;
  addNode: (nodeData: Omit<Node, 'id'>) => Promise<void>;
  updateNode: (id: string, data: Partial<Node['data']>) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  addEdge: (edgeData: Omit<Edge, 'id'>) => Promise<void>;
  updateEdge: (id: string, data: Partial<Edge['data']>) => Promise<void>;
  removeEdge: (id: string) => Promise<void>;
  setSelectedElements: (elements: { nodes: string[], edges: string[] }) => void;
  clearSelection: () => void;
  applyLayout: () => void;
}

interface Node {
  id: string;
  type?: string;
  position: { x: number, y: number };
  data: {
    label: string;
    type: string;
    properties: Record<string, any>;
    [key: string]: any;
  };
  style?: React.CSSProperties;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    label: string;
    type: string;
    properties: Record<string, any>;
    [key: string]: any;
  };
  style?: React.CSSProperties;
}
```

## API Specification

### Chat API (A2A-inspired)

- **Task Initiation**: `POST /api/tasks/send`
  ```typescript
  // Request
  {
    taskId: string;
    message: {
      role: 'user',
      parts: [{
        type: 'text',
        content: string
      }]
    }
  }
  
  // Response
  {
    taskId: string;
    status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
    messages: Message[];
    artifacts: Artifact[];
  }
  ```

- **Task Status**: `GET /api/tasks/{taskId}`
  ```typescript
  // Response
  {
    taskId: string;
    status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'canceled';
    messages: Message[];
    artifacts: Artifact[];
  }
  ```

- **Cancel Task**: `POST /api/tasks/{taskId}/cancel`
  ```typescript
  // Response
  {
    taskId: string;
    status: 'canceled';
  }
  ```

### Canvas API (Atomic)

- **Get Graph**: `GET /api/canvas/graph`
  ```typescript
  // Response
  {
    nodes: Node[];
    edges: Edge[];
  }
  ```

- **Nodes CRUD**:
  - `GET /api/canvas/nodes`
  - `POST /api/canvas/nodes`
  - `PUT /api/canvas/nodes/{nodeId}`
  - `DELETE /api/canvas/nodes/{nodeId}`

- **Edges CRUD**:
  - `GET /api/canvas/edges`
  - `POST /api/canvas/edges`
  - `PUT /api/canvas/edges/{edgeId}`
  - `DELETE /api/canvas/edges/{edgeId}`

## Component Design

### Main Components

1. **App**: Main layout component
   - Divides screen into chat and canvas panels
   - Manages global application state

2. **ChatInterface**: Left panel
   - Message list display
   - Input area for user messages
   - Support for different message part types

3. **CanvasInterface**: Right panel
   - React Flow implementation
   - Custom nodes and edges
   - Controls (zoom, pan, filters)
   - Mini-map for navigation

### UI/UX Considerations

- **Layout**: Split-panel interface with resizable panels
- **Theming**: Light/dark mode support
- **Responsiveness**: Adapts to different screen sizes
- **Accessibility**: ARIA-compliant components

## React Flow Implementation

### Custom Node Types

1. **EntityNode**: Standard knowledge entity
   - Clean, rounded rectangle design
   - Header with entity type
   - Body with key properties
   - Expandable to show more details

2. **HighlightedNode**: For emphasized entities
   - Similar to EntityNode but with visual distinction
   - Used when an entity is referenced in chat

### Edge Styling

- Different line styles/colors for different relationship types
- Directional arrows to indicate relationship direction
- Interactive labels showing relationship type

### Layout Algorithm

- Force-directed layout as default
- Option to switch to hierarchical or radial layouts
- Ability to manually position nodes and save layouts

## Integration Points

### Chat-Canvas Interaction

- When an entity is mentioned in chat, it's highlighted in the canvas
- Clicking a node in the canvas can trigger information display in chat
- New entities discovered in chat automatically appear in the canvas

### API Connection

- WebSocket or Server-Sent Events for real-time updates
- Optimistic UI updates for better user experience
- Proper error handling and retry mechanisms

## Deployment and Scalability

- Docker-based deployment
- Static assets served through CDN
- API rate limiting to prevent abuse
- Caching strategies for improved performance

## Future Enhancements

- Full-text search across the knowledge base
- Export/import functionality for graph data
- Collaborative editing features
- Integration with external knowledge sources 