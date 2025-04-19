import { create } from 'zustand';
import { canvasApi } from '../api/canvasApi';
import type { 
  CanvasState, 
  Node, 
  Edge, 
  NodeData, 
  EdgeData, 
  SelectedElements
} from '../types/canvas';

// Helper to generate positions with some randomness for new nodes
const generatePosition = () => ({
  x: 100 + Math.random() * 400,
  y: 100 + Math.random() * 300
});

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // State
  nodes: [],
  edges: [],
  selectedElements: { nodes: [], edges: [] },
  isLoading: false,
  error: null,

  // Actions
  fetchGraph: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { nodes, edges } = await canvasApi.getGraph();
      
      set({ 
        nodes, 
        edges, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  addNode: async (nodeData) => {
    try {
      set({ isLoading: true, error: null });
      
      // If position is not provided, generate one
      const nodeWithPosition = {
        ...nodeData,
        position: nodeData.position || generatePosition()
      };
      
      const newNode = await canvasApi.createNode(nodeWithPosition);
      
      set(state => ({ 
        nodes: [...state.nodes, newNode], 
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  updateNode: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedNode = await canvasApi.updateNode(id, data);
      
      set(state => ({
        nodes: state.nodes.map(node => 
          node.id === id ? updatedNode : node
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  removeNode: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await canvasApi.deleteNode(id);
      
      // Also remove any connected edges
      const { edges } = get();
      const affectedEdges = edges.filter(
        edge => edge.source === id || edge.target === id
      );
      
      for (const edge of affectedEdges) {
        await canvasApi.deleteEdge(edge.id);
      }
      
      set(state => ({
        nodes: state.nodes.filter(node => node.id !== id),
        edges: state.edges.filter(
          edge => edge.source !== id && edge.target !== id
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  addEdge: async (edgeData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newEdge = await canvasApi.createEdge(edgeData);
      
      set(state => ({ 
        edges: [...state.edges, newEdge], 
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  updateEdge: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedEdge = await canvasApi.updateEdge(id, data);
      
      set(state => ({
        edges: state.edges.map(edge => 
          edge.id === id ? updatedEdge : edge
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  removeEdge: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await canvasApi.deleteEdge(id);
      
      set(state => ({
        edges: state.edges.filter(edge => edge.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error as Error, 
        isLoading: false 
      });
    }
  },

  setSelectedElements: (elements) => {
    set({ selectedElements: elements });
  },

  clearSelection: () => {
    set({ selectedElements: { nodes: [], edges: [] } });
  },

  applyLayout: () => {
    // This is a placeholder for a future layout algorithm
    // For now, we just randomly reposition nodes
    set(state => ({
      nodes: state.nodes.map(node => ({
        ...node,
        position: generatePosition()
      }))
    }));
  }
})); 