import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import { initialNodes, initialEdges } from "../data/mindmapData";

interface Canvas {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: Date;
}

interface CanvasStore {
    canvases: Canvas[];
    currentCanvasId: string;
    addCanvas: () => void;
    setCurrentCanvas: (id: string) => void;
    updateCanvas: (id: string, nodes: Node[], edges: Edge[]) => void;
    updateCanvasName: (id: string, name: string) => void;
    initDefault: () => void;
}

const defaultCanvas: Canvas = {
    id: "ai-breakthroughs",
    name: "AI Agent Breakthroughs",
    nodes: [],
    edges: [],
    createdAt: new Date(),
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
    canvases: [defaultCanvas],
    currentCanvasId: defaultCanvas.id,

    addCanvas: () => {
        const newCanvas: Canvas = {
            id: `canvas-${Date.now()}`,
            name: "Untitled",
            nodes: [],
            edges: [],
            createdAt: new Date(),
        };

        set((state) => ({
            canvases: [...state.canvases, newCanvas],
            currentCanvasId: newCanvas.id,
        }));
    },

    setCurrentCanvas: (id: string) => {
        set({ currentCanvasId: id });
    },

    updateCanvas: (id: string, nodes: Node[], edges: Edge[]) => {
        const currentCanvas = get().canvases.find((c) => c.id === id);
        if (!currentCanvas) return;

        // Only update if there are actual changes
        const hasChanges =
            JSON.stringify(currentCanvas.nodes) !== JSON.stringify(nodes) ||
            JSON.stringify(currentCanvas.edges) !== JSON.stringify(edges);

        if (hasChanges) {
            set((state) => ({
                canvases: state.canvases.map((canvas) =>
                    canvas.id === id ? { ...canvas, nodes, edges } : canvas
                ),
            }));
        }
    },

    updateCanvasName: (id: string, name: string) => {
        set((state) => ({
            canvases: state.canvases.map((canvas) =>
                canvas.id === id ? { ...canvas, name } : canvas
            ),
        }));
    },

    initDefault: () => {
        const currentId = get().currentCanvasId;
        const currentCanvas = get().canvases.find((c) => c.id === currentId);
        
        if (!currentCanvas) return;
        
        // Check if the current canvas has empty nodes and edges
        if (currentCanvas.nodes.length === 0 && currentCanvas.edges.length === 0) {
            // Instead of adding all nodes at once, we'll add them gradually

            // Initialize with just the root node
            const rootNode = initialNodes.find(node => node.id === "root");
            if (!rootNode) return;

            set((state) => ({
                canvases: state.canvases.map((canvas) =>
                    canvas.id === currentId 
                        ? { ...canvas, nodes: [rootNode], edges: [] } 
                        : canvas
                ),
            }));

            // Build a dependency graph to determine node addition order
            const nodeConnections: Record<string, string[]> = {};
            
            // Initialize with empty arrays for each node
            for (const node of initialNodes) {
                nodeConnections[node.id] = [];
            }
            
            // Map connections based on edges
            for (const edge of initialEdges) {
                // Add target as a child of source
                nodeConnections[edge.source].push(edge.target);
            }
            
            // Track which nodes have been added
            const addedNodeIds = new Set<string>(["root"]);
            const nodesToAdd = [...initialNodes.filter(node => node.id !== "root")];
            const edgesToAdd = [...initialEdges];
            
            // Function to get next node to add (prioritize nodes whose parents are already added)
            const getNextNode = () => {
                for (let i = 0; i < nodesToAdd.length; i++) {
                    const node = nodesToAdd[i];
                    
                    // Find if this node has any parent in the already added nodes
                    const hasParentAdded = initialEdges.some(edge => 
                        edge.target === node.id && addedNodeIds.has(edge.source)
                    );
                    
                    if (hasParentAdded) {
                        // Remove node from the list and return it
                        nodesToAdd.splice(i, 1);
                        return node;
                    }
                }
                
                // If no node with parents found, return the first available one
                if (nodesToAdd.length > 0) {
                    return nodesToAdd.shift();
                }
                
                return null;
            };
            
            // Function to get relevant edges for a node
            const getRelevantEdges = (nodeId: string) => {
                const relevantEdges: Edge[] = [];
                
                for (let i = edgesToAdd.length - 1; i >= 0; i--) {
                    const edge = edgesToAdd[i];
                    
                    // If this edge connects to or from the current node, and both endpoints are added
                    if ((edge.source === nodeId || edge.target === nodeId) && 
                        addedNodeIds.has(edge.source) && addedNodeIds.has(edge.target)) {
                        relevantEdges.push(edge);
                        edgesToAdd.splice(i, 1);
                    }
                }
                
                return relevantEdges;
            };
            
            // Recursive function to add nodes with delays
            const addNextNode = () => {
                if (nodesToAdd.length === 0) return;
                
                const nextNode = getNextNode();
                if (!nextNode) return;
                
                // Mark node as added
                addedNodeIds.add(nextNode.id);
                
                // Get relevant edges for this node
                const newEdges = getRelevantEdges(nextNode.id);
                
                // Update the canvas with new node and edges
                set((state) => {
                    const currentCanvas = state.canvases.find((c) => c.id === currentId);
                    if (!currentCanvas) return state;
                    
                    const updatedNodes = [...currentCanvas.nodes, nextNode];
                    const updatedEdges = [...currentCanvas.edges, ...newEdges];
                    
                    return {
                        canvases: state.canvases.map((canvas) =>
                            canvas.id === currentId 
                                ? { ...canvas, nodes: updatedNodes, edges: updatedEdges } 
                                : canvas
                        ),
                    };
                });
                
                // Random delay between 50ms and 300ms
                const delay = Math.floor(Math.random() * 250) + 50;
                setTimeout(addNextNode, delay);
            };
            
            // Start the animation after a short delay
            setTimeout(addNextNode, 300);
        }
    },
}));
