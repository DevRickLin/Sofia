/**
 * Chat Store Types based on A2A Protocol
 */

export type TaskStatus = 
  | 'idle' 
  | 'submitted' 
  | 'working' 
  | 'input-required' 
  | 'completed' 
  | 'failed' 
  | 'canceled';

export interface TextPart {
  type: 'text';
  content: string;
}

export interface FilePart {
  type: 'file';
  mimeType: string;
  data: string | { uri: string };
  filename?: string;
}

export interface DataPart {
  type: 'data';
  mimeType: 'application/json';
  data: any;
}

export type MessagePart = TextPart | FilePart | DataPart;

export interface Message {
  role: 'user' | 'agent';
  parts: MessagePart[];
  timestamp: string;
}

export interface Artifact {
  id: string;
  parts: MessagePart[];
}

export interface TaskRequest {
  taskId: string;
  message: {
    role: 'user';
    parts: MessagePart[];
  };
}

export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  messages: Message[];
  artifacts: Artifact[];
}

export interface ChatState {
  // Core state
  taskId: string | null;
  messages: Message[];
  status: TaskStatus;
  artifacts: Artifact[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  initializeTask: () => void;
  sendMessage: (content: string) => Promise<void>;
  cancelTask: () => Promise<void>;
  resetChat: () => void;
} 