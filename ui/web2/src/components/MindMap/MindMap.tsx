// Runtime imports
import { useState, useCallback, useEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Type-only imports
import type { Node as FlowNode, ReactFlowInstance, NodeTypes } from "@xyflow/react";
import type { MouseEvent } from "react";

import { CategoryNode } from "./Nodes/CategoryNode";
import { BreakthroughNode } from "./Nodes/BreakthroughNode";
import Sidebar from "./Sidebar";
import SidePanel from "./SidePanel";
import { useTheme } from "../../context/ThemeContext";
import { useCanvasStore } from "../../store/canvasStore";
import type { KeyInsight } from "./types";

// Add custom styles for the canvas background
const canvasBackgroundStyle = {
    light: {
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(rgba(209, 213, 219, 0.5) 1px, transparent 1px), radial-gradient(rgba(209, 213, 219, 0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px, 24px 24px',
        backgroundPosition: '0 0, 12px 12px',
    },
    dark: {
        backgroundColor: '#1F2937',
        backgroundImage: 'radial-gradient(rgba(55, 65, 81, 0.15) 1px, transparent 1px), radial-gradient(rgba(55, 65, 81, 0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px, 24px 24px',
        backgroundPosition: '0 0, 12px 12px',
    },
};

// Define the structure for the custom event
interface FocusNodeEvent extends CustomEvent {
    detail: {
        nodeId: string;
    };
}

const nodeTypes: NodeTypes = {
    category: CategoryNode,
    breakthrough: BreakthroughNode,
};

export const MindMap = () => {
    const { theme } = useTheme();
    const { canvases, currentCanvasId, updateCanvas, addCanvas } =
        useCanvasStore();
    const currentCanvas = canvases.find((c) => c.id === currentCanvasId);

    const [nodes, setNodes, onNodesChange] = useNodesState(
        currentCanvas?.nodes || []
    );
    const [edges, setEdges, onEdgesChange] = useEdgesState(
        currentCanvas?.edges || []
    );
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    const deleteNode = useCallback((nodeId: string) => {
        console.log('Delete clicked for node:', nodeId);
    }, []);

    const expandNode = useCallback(
        (nodeId: string, forceExpand?: boolean) => {
            // First update the clicked node's expanded state
            let newExpandedState = false;
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        // If forceExpand is provided, use that value; otherwise toggle the current state
                        newExpandedState = forceExpand !== undefined ? forceExpand : !node.data.isExpanded;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                isExpanded: newExpandedState,
                            },
                        };
                    }
                    return node;
                })
            );

            // Get all descendant nodes recursively
            const getDescendantNodes = (parentId: string, allEdges: typeof edges): string[] => {
                const directChildren = allEdges
                    .filter(edge => edge.source === parentId)
                    .map(edge => edge.target);
                
                const descendants = [...directChildren];
                directChildren.forEach(childId => {
                    descendants.push(...getDescendantNodes(childId, allEdges));
                });
                
                return descendants;
            };

            // Get all descendant nodes of the clicked node
            const allDescendants = getDescendantNodes(nodeId, edges);

            // Update visibility of all descendant nodes
            setNodes((nds) =>
                nds.map((node) => {
                    if (allDescendants.includes(node.id)) {
                        // If parent is being collapsed, collapse all descendants and hide them
                        // If parent is being expanded, only show direct children
                        const isDirectChild = edges.some(edge => edge.source === nodeId && edge.target === node.id);
                        
                        return {
                            ...node,
                            hidden: !newExpandedState || !isDirectChild,
                            data: {
                                ...node.data,
                                isExpanded: false, // Collapse all descendants when parent is collapsed
                            },
                        };
                    }
                    return node;
                })
            );
        },
        [edges, setNodes]
    );

    useEffect(() => {
        if (currentCanvas) {
            // Add expand handler to all nodes
            const nodesWithHandlers = currentCanvas.nodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    expandNode: expandNode
                }
            }));
            setNodes(nodesWithHandlers);
            setEdges(currentCanvas.edges);
        }
    }, [currentCanvas, setNodes, setEdges, expandNode]);

    // useEffect(() => {
    //     const timeoutId = setTimeout(() => {
    //         if (currentCanvasId && (nodes.length > 0 || edges.length > 0)) {
    //             // Remove handlers before saving to avoid circular references
    //             const nodesForSave = nodes.map(node => ({
    //                 ...node,
    //                 data: {
    //                     ...node.data,
    //                     onDelete: undefined,
    //                     expandNode: undefined
    //                 }
    //             }));
    //             updateCanvas(currentCanvasId, nodesForSave, edges);
    //         }
    //     }, 500);

    //     return () => clearTimeout(timeoutId);
    // }, [nodes, edges, currentCanvasId, updateCanvas]);

    useEffect(() => {
        const handleFocusNode = (event: FocusNodeEvent) => {
            if (!reactFlowInstance) return;

            const nodeId = event.detail.nodeId;
            const node = nodes.find((n) => n.id === nodeId);

            if (node) {
                // Center view on node with some zoom
                const x = node.position?.x || 0;
                const y = node.position?.y || 0;
                reactFlowInstance.setCenter(x, y, {
                    zoom: 1.5,
                    duration: 800,
                });

                // Select the node
                setSelectedNode(node);
                setIsPanelOpen(true);
            }
        };

        window.addEventListener("focusNode", handleFocusNode as EventListener);
        return () =>
            window.removeEventListener(
                "focusNode",
                handleFocusNode as EventListener
            );
    }, [reactFlowInstance, nodes]);

    const handleBackgroundClick = useCallback(() => {
        setIsPanelOpen(false);
        setSidebarExpanded(false);
    }, []);

    const onNodeClick = useCallback((event: MouseEvent, node: FlowNode) => {
        event.stopPropagation();
        // Only show right panel for nodes that have been populated with insights
        if (node.data.summary && node.data.summary !== "Click to start a conversation and explore insights") {
            setSelectedNode(node);
            setIsPanelOpen(true);
            setSidebarExpanded(false);
        } else if (node.type === "breakthrough" && !node.data.summary) {
            // For new question nodes, expand the chat sidebar
            setSidebarExpanded(true);
        }
    }, []);

    const createCustomNode = useCallback(() => {
        if (!reactFlowInstance) return;

        const transform = reactFlowInstance.toObject().viewport;
        const position = {
            x: (window.innerWidth / 2 - 100 - transform.x) / transform.zoom,
            y: (window.innerHeight / 2 - 50 - transform.y) / transform.zoom,
        };

        const newNode: FlowNode = {
            id: `question-${Date.now()}`,
            type: "breakthrough",
            position,
            data: {
                id: `question-${Date.now()}`,
                title: "Ask a Question",
                summary: "Click to start a conversation and explore insights",
                details: "",
                date: new Date().toISOString(),
                organization: "",
                source: "",
                keyInsights: [],
                position,
                color: "emerald",
                expandNode: expandNode,
                onSelect: () => {
                    setSidebarExpanded(true);
                },
            },
            draggable: true,
        };

        setNodes((nds) => [...nds, newNode]);
        // Only expand the sidebar for chat
        setSidebarExpanded(true);
    }, [reactFlowInstance, setNodes, setSidebarExpanded, expandNode]);

    const handleNewCanvas = useCallback(() => {
        addCanvas();
    }, [addCanvas]);

    const handleAddKeyInsight = useCallback((nodeId: string, insight: KeyInsight) => {
        console.log('MindMap handleAddKeyInsight called with:', { nodeId, insight });
        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    const nodeData = node.data;
                    const keyInsights: KeyInsight[] = Array.isArray(nodeData.keyInsights) ? nodeData.keyInsights : [];
                    console.log('Current keyInsights:', keyInsights);
                    
                    // Find the insight by content since it's unique
                    const existingInsightIndex = keyInsights.findIndex(
                        (i) => i.content === insight.content
                    );
                    console.log('existingInsightIndex:', existingInsightIndex);

                    let updatedInsights: KeyInsight[];
                    if (existingInsightIndex !== -1) {
                        // Update existing insight
                        updatedInsights = [...keyInsights];
                        updatedInsights[existingInsightIndex] = {
                            ...updatedInsights[existingInsightIndex],
                            visible: true
                        };
                        console.log('Updating existing insight:', updatedInsights[existingInsightIndex]);
                    } else {
                        // Add new insight with visible flag
                        updatedInsights = [...keyInsights, { ...insight, visible: true }];
                        console.log('Adding new insight:', insight);
                    }

                    // Create updated node with expanded state set to true
                    const updatedNode = {
                        ...node,
                        data: {
                            ...nodeData,
                            keyInsights: updatedInsights,
                            isExpanded: true // Always set to expanded when adding/showing insights
                        }
                    };

                    // Always expand the node when showing an insight, regardless of current state
                    console.log('Expanding node:', nodeId);
                    // Use setTimeout to ensure the DOM has updated with new content before expanding
                    setTimeout(() => {
                        expandNode(nodeId, true);
                        
                        // Trigger another expansion after a delay to ensure full content visibility
                        // This helps with dynamic content that may still be rendering
                        setTimeout(() => {
                            expandNode(nodeId, true);
                            
                            // Focus on the node to make sure the user can see it
                            if (reactFlowInstance) {
                                const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
                                if (nodeElement) {
                                    const rect = nodeElement.getBoundingClientRect();
                                    const nodeX = node.position.x;
                                    const nodeY = node.position.y;
                                    reactFlowInstance.setCenter(nodeX, nodeY, { 
                                        zoom: reactFlowInstance.getZoom(),
                                        duration: 300 
                                    });
                                }
                            }
                        }, 200);
                    }, 0);

                    console.log('Updated node:', updatedNode);
                    return updatedNode;
                }
                return node;
            });

            console.log('New nodes state:', newNodes);
            return newNodes;
        });
    }, [expandNode, reactFlowInstance]);

    const handleRemoveKeyInsight = useCallback((nodeId: string, insightIndex: number) => {
        console.log('MindMap handleRemoveKeyInsight called with:', { nodeId, insightIndex });
        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    const nodeData = node.data;
                    const keyInsights: KeyInsight[] = Array.isArray(nodeData.keyInsights) ? nodeData.keyInsights : [];
                    console.log('Current keyInsights:', keyInsights);
                    console.log('Insight at index:', insightIndex, keyInsights[insightIndex]);
                    
                    // Make sure the index exists
                    if (keyInsights[insightIndex]) {
                        const updatedInsights = [...keyInsights];
                        updatedInsights[insightIndex] = {
                            ...updatedInsights[insightIndex],
                            visible: false
                        };
                        console.log('Updated insight:', updatedInsights[insightIndex]);

                        const updatedNode = {
                            ...node,
                            data: {
                                ...nodeData,
                                keyInsights: updatedInsights
                            }
                        };
                        console.log('Updated node:', updatedNode);
                        return updatedNode;
                    } else {
                        console.error('Invalid insight index:', insightIndex, 'for keyInsights:', keyInsights);
                    }
                }
                return node;
            });

            console.log('New nodes state:', newNodes);
            return newNodes;
        });
    }, []);

    return (
        <div className="relative flex h-full w-full">
            <Sidebar
                onAddNode={createCustomNode}
                onNewCanvas={handleNewCanvas}
                isExpanded={sidebarExpanded}
                onToggleExpanded={setSidebarExpanded}
            />
            <div 
                className="flex-1"
                style={theme === 'dark' ? canvasBackgroundStyle.dark : canvasBackgroundStyle.light}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onPaneClick={handleBackgroundClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                    minZoom={0.2}
                    maxZoom={1.5}
                    nodesDraggable={true}
                    elementsSelectable={true}
                    proOptions={{ hideAttribution: true }}
                    onInit={setReactFlowInstance}
                    panOnScroll={true}
                    panOnDrag={true}
                >
                    <Background
                        color={theme === "dark" ? "rgba(55, 65, 81, 0.1)" : "rgba(209, 213, 219, 0.3)"}
                        gap={24}
                        size={1}
                        variant={BackgroundVariant.Dots}
                    />
                    <Controls className="m-2 text-gray-500 dark:text-gray-100" />
                </ReactFlow>
            </div>
            <SidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                node={selectedNode}
                expandNode={expandNode}
                onAddKeyInsight={handleAddKeyInsight}
                onRemoveKeyInsight={handleRemoveKeyInsight}
            />
        </div>
    );
};
