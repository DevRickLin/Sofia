import axios from 'axios';
import { 
  type TaskRequest, 
  type TaskResponse, 
  Message, 
  type TextPart 
} from '../types/chat';

const API_BASE_URL = '/api';

/**
 * Chat API client implementing A2A protocol interface
 */
export const chatApi = {
  /**
   * Send a message to the agent
   */
  sendMessage: async (taskId: string, message: string): Promise<TaskResponse> => {
    const textPart: TextPart = {
      type: 'text',
      content: message
    };

    const request: TaskRequest = {
      taskId,
      message: {
        role: 'user',
        parts: [textPart]
      }
    };

    const response = await axios.post<TaskResponse>(
      `${API_BASE_URL}/tasks/send`,
      request
    );

    return response.data;
  },

  /**
   * Get task status
   */
  getTask: async (taskId: string): Promise<TaskResponse> => {
    const response = await axios.get<TaskResponse>(
      `${API_BASE_URL}/tasks/${taskId}`
    );

    return response.data;
  },

  /**
   * Cancel a task
   */
  cancelTask: async (taskId: string): Promise<TaskResponse> => {
    const response = await axios.post<TaskResponse>(
      `${API_BASE_URL}/tasks/${taskId}/cancel`
    );

    return response.data;
  }
}; 