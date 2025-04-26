/**
 * A2A Protocol TypeScript Implementation
 * Based on the Python implementation and A2A specification
 */

export enum TaskState {
  SUBMITTED = "submitted",
  WORKING = "working",
  INPUT_REQUIRED = "input-required",
  COMPLETED = "completed",
  CANCELED = "canceled",
  FAILED = "failed",
  UNKNOWN = "unknown"
}

export type TextPart = {
  type: "text";
  text: string;
  metadata?: Record<string, unknown> | null;
};

export type DataPart = {
  type: "data";
  data: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
};

export type FilePart = {
  type: "file";
  file: {
    bytes?: string | null;
    uri?: string | null;
  };
  metadata?: Record<string, unknown> | null;
};

export type Part = TextPart | DataPart | FilePart;

export type Message = {
  role: "user" | "agent";
  parts: Part[];
  metadata?: Record<string, unknown> | null;
};

export type TaskStatus = {
  state: TaskState;
  message?: Message | null;
  timestamp: string;
};

export type Artifact = {
  name?: string | null;
  description?: string | null;
  parts: Part[];
  metadata?: Record<string, unknown> | null;
};

export type Task = {
  id: string;
  sessionId?: string | null;
  status: TaskStatus;
  artifacts?: Artifact[] | null;
  history?: Message[] | null;
  metadata?: Record<string, unknown> | null;
};

export type TaskStatusUpdateEvent = {
  id: string;
  status: TaskStatus;
  final: boolean;
  metadata?: Record<string, unknown> | null;
};

export type TaskArtifactUpdateEvent = {
  id: string;
  artifact: Artifact;
  metadata?: Record<string, unknown> | null;
};

export type TaskIdParams = {
  id: string;
  metadata?: Record<string, unknown> | null;
};

export type TaskQueryParams = TaskIdParams & {
  historyLength?: number | null;
};

export type TaskSendParams = {
  id?: string;
  sessionId?: string;
  message: Message;
  historyLength?: number | null;
  metadata?: Record<string, unknown> | null;
};

// JSON-RPC classes
export type JSONRPCMessage = {
  jsonrpc: "2.0";
  id?: string | number | null;
};

export type JSONRPCRequest = JSONRPCMessage & {
  method: string;
  params?: Record<string, unknown> | null;
};

export type JSONRPCError = {
  code: number;
  message: string;
  data?: unknown | null;
};

export type JSONRPCResponse = JSONRPCMessage & {
  result?: unknown | null;
  error?: JSONRPCError | null;
};

export type SendTaskRequest = JSONRPCRequest & {
  method: "tasks/send";
  params: TaskSendParams;
};

export type SendTaskResponse = JSONRPCResponse & {
  result?: Task | null;
};

// Streaming classes
export type SendTaskStreamingRequest = JSONRPCRequest & {
  method: "tasks/send/stream";
  params: TaskSendParams;
};

export type SendTaskStreamingResponse = JSONRPCResponse & {
  result?: TaskStatusUpdateEvent | TaskArtifactUpdateEvent | null;
};

// Get task request/response
export type GetTaskRequest = JSONRPCRequest & {
  method: "tasks/get";
  params: TaskQueryParams;
};

export type GetTaskResponse = JSONRPCResponse & {
  result?: Task | null;
};

// Error types
export const JSONRPCErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
};

export type AgentSkill = {
  id: string;
  name: string;
  description?: string | null;
  examples?: string[] | null;
};

export type AgentCard = {
  name: string;
  description?: string | null;
  url: string;
  version: string;
  skills: AgentSkill[];
};

// Error classes
export class A2AClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "A2AClientError";
  }
}

export class A2AClientHTTPError extends A2AClientError {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(`HTTP Error ${statusCode}: ${message}`);
    this.name = "A2AClientHTTPError";
    this.statusCode = statusCode;
  }
}

export class A2AClientJSONError extends A2AClientError {
  constructor(message: string) {
    super(`JSON Error: ${message}`);
    this.name = "A2AClientJSONError";
  }
} 