/**
 * Canvas Store Types for graph visualization with React Flow
 */

export interface NodeData {
  label: string;
  type: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EdgeData {
  label: string;
  type: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Node {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: NodeData;
  style?: React.CSSProperties;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: EdgeData;
  style?: React.CSSProperties;
}

export interface SelectedElements {
  nodes: string[];
  edges: string[];
}

export interface GraphResponse {
  nodes: Node[];
  edges: Edge[];
}

export interface CanvasState {
  // Core state
  nodes: Node[];
  edges: Edge[];
  selectedElements: SelectedElements;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchGraph: () => Promise<void>;
  addNode: (nodeData: Omit<Node, 'id'>) => Promise<void>;
  updateNode: (id: string, data: Partial<NodeData>) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  addEdge: (edgeData: Omit<Edge, 'id'>) => Promise<void>;
  updateEdge: (id: string, data: Partial<EdgeData>) => Promise<void>;
  removeEdge: (id: string) => Promise<void>;
  setSelectedElements: (elements: SelectedElements) => void;
  clearSelection: () => void;
  applyLayout: () => void;
} 