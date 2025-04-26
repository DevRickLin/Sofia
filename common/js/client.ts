/**
 * TypeScript implementation of the A2A Client
 * 
 * Required packages:
 * npm install uuid axios eventsource-parser
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { createParser } from 'eventsource-parser';
import type {
  TaskState,
  Task,
  Message,
  TextPart,
  DataPart,
  FilePart,
  Part,
  TaskStatus,
  Artifact,
  TaskIdParams,
  TaskQueryParams,
  TaskSendParams,
  JSONRPCRequest,
  JSONRPCResponse,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  SendTaskResponse,
  SendTaskStreamingResponse,
  GetTaskResponse,
  AgentCard
} from './protocol';
import {
  A2AClientError,
  A2AClientHTTPError,
  A2AClientJSONError
} from './protocol';

/**
 * A2A Client for TypeScript
 */
export class A2AClient {
  private url: string;
  private requestId: string | null = null;

  /**
   * Create a new A2A client
   * @param agentCard - Agent card containing URL (optional)
   * @param url - URL for the agent (optional if agentCard is provided)
   */
  constructor(agentCard?: AgentCard | null, url?: string | null) {
    if (agentCard?.url) {
      this.url = agentCard.url;
    } else if (url) {
      this.url = url;
    } else {
      throw new Error('Must provide either agentCard or url');
    }
  }

  /**
   * Creates a text part object
   * @param text - The text content
   * @param metadata - Optional metadata
   * @returns TextPart object
   */
  createTextPart(text: string, metadata?: Record<string, unknown> | null): TextPart {
    return {
      type: 'text',
      text,
      metadata: metadata || null
    };
  }

  /**
   * Creates a data part object
   * @param data - The data object
   * @param metadata - Optional metadata
   * @returns DataPart object
   */
  createDataPart(data: Record<string, unknown>, metadata?: Record<string, unknown> | null): DataPart {
    return {
      type: 'data',
      data,
      metadata: metadata || null
    };
  }

  /**
   * Creates a file part object
   * @param file - File content as base64 string or URI
   * @param metadata - Optional metadata
   * @returns FilePart object
   */
  createFilePart(file: { bytes?: string | null, uri?: string | null }, metadata?: Record<string, unknown> | null): FilePart {
    if (!file.bytes && !file.uri) {
      throw new Error('File part must have either bytes or uri');
    }
    return {
      type: 'file',
      file,
      metadata: metadata || null
    };
  }

  /**
   * Creates a message object
   * @param role - Role of the message sender ('user' or 'agent')
   * @param parts - Array of message parts
   * @param metadata - Optional metadata
   * @returns Message object
   */
  createMessage(role: 'user' | 'agent', parts: Part[], metadata?: Record<string, unknown> | null): Message {
    return {
      role,
      parts,
      metadata: metadata || null
    };
  }

  /**
   * Creates a task status object
   * @param state - State of the task
   * @param message - Optional message
   * @returns TaskStatus object
   */
  createTaskStatus(state: TaskState, message?: Message | null): TaskStatus {
    return {
      state,
      message: message || null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send a task to the agent
   * @param message - Message to send (can be a string, data object, or Message object)
   * @param id - Task ID (optional)
   * @param sessionId - Session ID (optional)
   * @param historyLength - Number of history messages to include (optional)
   * @param metadata - Additional metadata (optional)
   * @returns Promise<Task> - Task object
   */
  async sendTask(
    message: string | Record<string, unknown> | Message,
    id?: string,
    sessionId?: string,
    historyLength?: number,
    metadata?: Record<string, unknown>
  ): Promise<Task> {
    // Create message object if needed
    let msg: Message;
    
    if (typeof message === 'string') {
      // String message
      msg = this.createMessage('user', [this.createTextPart(message)]);
    } else if (typeof message === 'object' && 'role' in message && 'parts' in message) {
      // Message object
      msg = message as Message;
    } else if (typeof message === 'object') {
      // Data message
      msg = this.createMessage('user', [this.createDataPart(message as Record<string, unknown>)]);
    } else {
      throw new Error(`Unsupported message type: ${typeof message}`);
    }

    // Create task params
    const params: TaskSendParams = {
      id: id || uuidv4(),
      sessionId: sessionId || uuidv4(),
      message: msg,
      historyLength: historyLength || null,
      metadata: metadata || null
    };

    // Create request
    const requestId = uuidv4();
    this.requestId = requestId;
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'tasks/send',
      params,
      id: requestId
    };

    // Send request
    const response = await this._sendRequest(request) as SendTaskResponse;
    
    if (response.error) {
      throw new A2AClientError(`Error: ${response.error.message}`);
    }
    
    if (!response.result) {
      throw new A2AClientError('No result in response');
    }
    
    return response.result;
  }

  /**
   * Send a task to the agent and receive streaming responses
   * @param message - Message to send (can be a string, data object, or Message object)
   * @param id - Task ID (optional)
   * @param sessionId - Session ID (optional)
   * @param historyLength - Number of history messages to include (optional)
   * @param metadata - Additional metadata (optional)
   * @returns AsyncGenerator yielding TaskStatusUpdateEvent or TaskArtifactUpdateEvent objects
   */
  async *sendTaskStreaming(
    message: string | Record<string, unknown> | Message,
    id?: string,
    sessionId?: string,
    historyLength?: number,
    metadata?: Record<string, unknown>
  ): AsyncGenerator<TaskStatusUpdateEvent | TaskArtifactUpdateEvent> {
    // Create message object if needed
    let msg: Message;
    
    if (typeof message === 'string') {
      // String message
      msg = this.createMessage('user', [this.createTextPart(message)]);
    } else if (typeof message === 'object' && 'role' in message && 'parts' in message) {
      // Message object
      msg = message as Message;
    } else if (typeof message === 'object') {
      // Data message
      msg = this.createMessage('user', [this.createDataPart(message as Record<string, unknown>)]);
    } else {
      throw new Error(`Unsupported message type: ${typeof message}`);
    }

    // Create task params
    const taskId = id || uuidv4();
    const params: TaskSendParams = {
      id: taskId,
      sessionId: sessionId || uuidv4(),
      message: msg,
      historyLength: historyLength || null,
      metadata: metadata || null
    };

    // Create streaming request
    const requestId = uuidv4();
    this.requestId = requestId;
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'tasks/send/stream',
      params,
      id: requestId
    };

    try {
      // Browser-compatible approach using fetch API for streaming
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new A2AClientHTTPError(
          response.status,
          `HTTP Error: ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Create parser for SSE
      let lastParsedData: SendTaskStreamingResponse | undefined;
      
      const parser = createParser((event) => {
        if (event.type === 'event' && event.data) {
          try {
            lastParsedData = JSON.parse(event.data);
          } catch (e) {
            console.error(`JSON parse error: ${e}`);
            throw new A2AClientJSONError(`JSON parse error: ${String(e)}`);
          }
        }
      });

      // Use browser ReadableStream API to process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert Uint8Array to string
        const chunk = decoder.decode(value, { stream: true });
        parser.feed(chunk);
        
        if (lastParsedData?.result) {
          const parsedData = lastParsedData.result;
          lastParsedData = undefined; // Reset after yielding
          yield parsedData as (TaskStatusUpdateEvent | TaskArtifactUpdateEvent);
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new A2AClientHTTPError(
            error.response.status,
            `HTTP Error: ${error.message}`
          );
        } 
        throw new A2AClientHTTPError(0, `Network Error: ${error.message}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new A2AClientJSONError(`Error: ${errorMessage}`);
    }
  }

  /**
   * Get a task by ID
   * @param id - Task ID
   * @param historyLength - Number of history messages to include (optional)
   * @param metadata - Additional metadata (optional)
   * @returns Promise<Task> - Task object
   */
  async getTask(id: string, historyLength?: number, metadata?: Record<string, unknown>): Promise<Task> {
    const params: TaskQueryParams = {
      id,
      historyLength: historyLength || null,
      metadata: metadata || null
    };
    
    const requestId = uuidv4();
    this.requestId = requestId;
    
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'tasks/get',
      params,
      id: requestId
    };
    
    const response = await this._sendRequest(request) as GetTaskResponse;
    
    if (response.error) {
      throw new A2AClientError(`Error: ${response.error.message}`);
    }
    
    if (!response.result) {
      throw new A2AClientError('No result in response');
    }
    
    return response.result;
  }

  /**
   * Create an artifact
   * @param parts - Array of parts for the artifact
   * @param name - Optional name for the artifact
   * @param description - Optional description for the artifact
   * @param metadata - Optional metadata for the artifact
   * @returns Artifact object
   */
  createArtifact(
    parts: Part[],
    name?: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Artifact {
    return {
      name: name || null,
      description: description || null,
      parts,
      metadata: metadata || null
    };
  }

  /**
   * Send a request to the agent
   * @param request - JSON-RPC request
   * @returns Promise<JSONRPCResponse> - JSON-RPC response
   * @private
   */
  private async _sendRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    try {
      // Use fetch API which is available in browsers
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new A2AClientHTTPError(
          response.status,
          `HTTP Error: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof A2AClientHTTPError) {
        // Already formatted error
        throw error;
      }
      
      // Network error or other
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new A2AClientJSONError(`Error: ${errorMessage}`);
    }
  }
}

// Re-export types from protocol.ts
export * from './protocol'; 