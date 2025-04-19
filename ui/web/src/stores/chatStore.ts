import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { chatApi } from '../api/chatApi';
import { 
  type ChatState, 
  type Message, 
  TaskStatus,
  Artifact
} from '../types/chat';

export const useChatStore = create<ChatState>((set, get) => ({
  // State
  taskId: null,
  messages: [],
  status: 'idle',
  artifacts: [],
  isLoading: false,
  error: null,

  // Actions
  initializeTask: () => {
    const taskId = uuidv4();
    set({ 
      taskId, 
      messages: [], 
      status: 'idle', 
      artifacts: [], 
      error: null 
    });
    return taskId;
  },

  sendMessage: async (content: string) => {
    let { taskId } = get();
    const { messages } = get();
    
    // Initialize task if it doesn't exist
    if (!taskId) {
      get().initializeTask();
      taskId = get().taskId;
      if (!taskId) {
        throw new Error('Task ID is null');
      }
    }

    try {
      // Update state to show we're sending
      set({ 
        isLoading: true,
        status: 'submitted',
        error: null
      });

      // Add user message to the state immediately
      const userMessage: Message = {
        role: 'user',
        parts: [{ type: 'text', content }],
        timestamp: new Date().toISOString()
      };
      
      set({ messages: [...messages, userMessage] });
      // Send message to API
      const response = await chatApi.sendMessage(taskId, content);
      
      // Update state with API response
      set({ 
        status: response.status,
        messages: response.messages,
        artifacts: response.artifacts,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error as Error,
        status: 'failed',
        isLoading: false
      });
    }
  },

  cancelTask: async () => {
    const { taskId } = get();
    
    if (!taskId) {
      return;
    }

    try {
      set({ isLoading: true });
      
      const response = await chatApi.cancelTask(taskId);
      
      set({ 
        status: response.status,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error as Error,
        isLoading: false
      });
    }
  },

  resetChat: () => {
    set({
      taskId: null,
      messages: [],
      status: 'idle',
      artifacts: [],
      isLoading: false,
      error: null
    });
  }
})); 