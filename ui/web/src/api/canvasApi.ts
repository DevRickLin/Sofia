import axios from 'axios';
import type { 
  Node, 
  Edge, 
  GraphResponse, 
  NodeData, 
  EdgeData 
} from '../types/canvas';

const API_BASE_URL = '/api/canvas';

/**
 * Canvas API client for graph operations
 */
export const canvasApi = {
  /**
   * Fetch the entire graph
   */
  getGraph: async (): Promise<GraphResponse> => {
    const response = await axios.get<GraphResponse>(`${API_BASE_URL}/graph`);
    return response.data;
  },

  /**
   * Get all nodes
   */
  getNodes: async (): Promise<Node[]> => {
    const response = await axios.get<Node[]>(`${API_BASE_URL}/nodes`);
    return response.data;
  },

  /**
   * Create a new node
   */
  createNode: async (node: Omit<Node, 'id'>): Promise<Node> => {
    const response = await axios.post<Node>(`${API_BASE_URL}/nodes`, node);
    return response.data;
  },

  /**
   * Update an existing node
   */
  updateNode: async (id: string, data: Partial<NodeData>): Promise<Node> => {
    const response = await axios.put<Node>(`${API_BASE_URL}/nodes/${id}`, { data });
    return response.data;
  },

  /**
   * Delete a node
   */
  deleteNode: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/nodes/${id}`);
  },

  /**
   * Get all edges
   */
  getEdges: async (): Promise<Edge[]> => {
    const response = await axios.get<Edge[]>(`${API_BASE_URL}/edges`);
    return response.data;
  },

  /**
   * Create a new edge
   */
  createEdge: async (edge: Omit<Edge, 'id'>): Promise<Edge> => {
    const response = await axios.post<Edge>(`${API_BASE_URL}/edges`, edge);
    return response.data;
  },

  /**
   * Update an existing edge
   */
  updateEdge: async (id: string, data: Partial<EdgeData>): Promise<Edge> => {
    const response = await axios.put<Edge>(`${API_BASE_URL}/edges/${id}`, { data });
    return response.data;
  },

  /**
   * Delete an edge
   */
  deleteEdge: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/edges/${id}`);
  }
}; 