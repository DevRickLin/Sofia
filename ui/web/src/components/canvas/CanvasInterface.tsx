import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  Edge,
  type Node as ReactFlowNode,
  BackgroundVariant,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '../../stores/canvasStore';
import { EntityNode, RelationshipEdge } from './components';
import type { Node, Edge as CustomEdge } from '../../types/canvas';

// Register custom node and edge types
const nodeTypes = {
  entity: EntityNode
};

const edgeTypes = {
  relationship: RelationshipEdge
};

const CanvasInterface: React.FC = () => {
  // Get data and actions from canvas store
  const {
    nodes: storeNodes,
    edges: storeEdges,
    isLoading,
    error,
    fetchGraph,
    addEdge: addStoreEdge,
  } = useCanvasStore();

  // React Flow internal state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load initial data
  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Update React Flow nodes when store nodes change
  useEffect(() => {
    if (storeNodes.length > 0) {
      const flowNodes: ReactFlowNode[] = storeNodes.map((node: Node) => ({
        ...node,
        type: 'entity', // Use our custom node type
        data: {
          ...node.data,
          id: node.id // Pass ID to the node data for display
        }
      }));
      setNodes(flowNodes);
    }
  }, [storeNodes, setNodes]);

  // Update React Flow edges when store edges change
  useEffect(() => {
    if (storeEdges.length > 0) {
      const flowEdges = storeEdges.map((edge: CustomEdge) => ({
        ...edge,
        type: 'relationship', // Use our custom edge type
        data: edge.data || {
          label: 'relates to',
          type: 'relationship',
          properties: {}
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#94a3b8'
        }
      }));
      setEdges(flowEdges);
    }
  }, [storeEdges, setEdges]);

  // Handle new edge connections
  const onConnect = useCallback(
    (connection: Connection) => {
      // First update the visual representation
      setEdges((eds) => addEdge({
        ...connection,
        type: 'relationship',
        data: {
          label: 'relates to',
          type: 'relationship',
          properties: {}
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#94a3b8'
        }
      }, eds));

      // Then update the store and backend
      if (connection.source && connection.target) {
        addStoreEdge({
          source: connection.source,
          target: connection.target,
          data: {
            label: 'relates to',
            type: 'relationship',
            properties: {}
          }
        });
      }
    },
    [setEdges, addStoreEdge]
  );

  // Panel buttons style
  const buttonClass = "px-3 py-2 bg-white border border-secondary-200 rounded-md shadow-sm text-sm font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-800 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-700";

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-secondary-900/50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-t-primary-500 border-secondary-200 rounded-full animate-spin" />
            <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading knowledge graph...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 right-4 z-10 p-4 bg-red-50 border border-red-200 rounded-md shadow-md dark:bg-red-900 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error.message || 'Error loading knowledge graph'}</p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Panel position="top-right" className="space-x-2">
          <button className={buttonClass} onClick={() => fetchGraph()} type="button">
            Refresh Graph
          </button>
          <button className={buttonClass} onClick={() => useCanvasStore.getState().applyLayout()} type="button">
            Auto Layout
          </button>
        </Panel>
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            switch (node.type) {
              case 'entity':
                return '#0ea5e9'; // primary-500
              default:
                return '#64748b'; // secondary-500
            }
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
        />
      </ReactFlow>
    </div>
  );
};

export { CanvasInterface }; 