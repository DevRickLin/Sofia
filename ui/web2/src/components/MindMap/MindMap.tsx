import React, { useState, useCallback, useEffect } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    NodeTypes,
    Node,
    ReactFlowInstance,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { CategoryNode } from "./Nodes/CategoryNode";
import { BreakthroughNode } from "./Nodes/BreakthroughNode";
import Sidebar from "./Sidebar";
import SidePanel from "./SidePanel";
import { useTheme } from "../../context/ThemeContext";
import { useCanvasStore } from "../../store/canvasStore";

const nodeTypes: NodeTypes = {
    category: CategoryNode,
    breakthrough: BreakthroughNode,
};

export const MindMap: React.FC = () => {
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
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] =
        useState<ReactFlowInstance | null>(null);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    useEffect(() => {
        if (currentCanvas) {
            setNodes(currentCanvas.nodes);
            setEdges(currentCanvas.edges);
        }
    }, [currentCanvasId, currentCanvas, setNodes, setEdges]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentCanvasId && (nodes.length > 0 || edges.length > 0)) {
                updateCanvas(currentCanvasId, nodes, edges);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [nodes, edges, currentCanvasId, updateCanvas]);

    useEffect(() => {
        const handleFocusNode = (event: CustomEvent) => {
            if (!reactFlowInstance) return;

            const nodeId = event.detail.nodeId;
            const node = nodes.find((n) => n.id === nodeId);

            if (node) {
                // Center view on node with some zoom
                reactFlowInstance.setCenter(node.position.x, node.position.y, {
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

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        event.stopPropagation();
        if (node.type === "custom") {
            setSidebarExpanded(true);
        } else {
            setSelectedNode(node);
            setIsPanelOpen(true);
        }
    }, []);

    const handleBackgroundClick = useCallback(() => {
        setIsPanelOpen(false);
    }, []);

    const createCustomNode = useCallback(() => {
        if (!reactFlowInstance) return;

        const transform = reactFlowInstance.toObject().viewport;
        const position = {
            x: (window.innerWidth / 2 - 100 - transform.x) / transform.zoom,
            y: (window.innerHeight / 2 - 50 - transform.y) / transform.zoom,
        };

        const newNode: Node = {
            id: `custom-${Date.now()}`,
            type: "custom",
            position,
            data: {
                question: "",
                onDelete: (id: string) => {
                    setNodes((nds) => nds.filter((node) => node.id !== id));
                    setEdges((eds) =>
                        eds.filter(
                            (edge) => edge.source !== id && edge.target !== id
                        )
                    );
                },
                onSelect: (_id: string) => {
                    setSidebarExpanded(true);
                },
            },
            draggable: true,
        };

        setNodes((nds) => [...nds, newNode]);
    }, [reactFlowInstance, setNodes, setEdges]);

    const handleNewCanvas = useCallback(() => {
        addCanvas();
    }, [addCanvas]);

    const expandNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                isExpanded: !node.data.isExpanded,
                            },
                        };
                    }
                    return node;
                })
            );

            const childEdges = edges.filter((edge) => edge.source === nodeId);
            const childNodeIds = childEdges.map((edge) => edge.target);

            setNodes((nds) =>
                nds.map((node) => {
                    if (childNodeIds.includes(node.id)) {
                        return {
                            ...node,
                            hidden: !node.hidden,
                        };
                    }
                    return node;
                })
            );
        },
        [edges, setNodes]
    );

    return (
        <div className="relative flex h-full w-full">
            <Sidebar
                onAddNode={createCustomNode}
                onNewCanvas={handleNewCanvas}
                isExpanded={sidebarExpanded}
                onToggleExpanded={setSidebarExpanded}
            />
            <div className="flex-1">
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
                >
                    <Background
                        color={theme === "dark" ? "#374151" : "#e0e0e066"}
                        gap={32}
                        size={1}
                        bgColor="#fafafa"
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
            />
        </div>
    );
};
