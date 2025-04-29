// Runtime imports
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Type-only imports
import type {
  Node as FlowNode,
  ReactFlowInstance,
} from "@xyflow/react";
import type { MouseEvent } from "react";

import { CategoryNode } from "./Nodes/CategoryNode";
import { BreakthroughNode } from "./Nodes/BreakthroughNode";
import Sidebar from "./Sidebar";
import SidePanel from "./SidePanel";
import type { NodeChildData } from "./SidePanel";
import { useTheme } from "../../context/ThemeContext";
import { useCanvasStore } from "../../store/canvasStore";
import type { KeyInsight, NodeData } from "./types";
import type { ChatMessage } from "../../services/mock2";
import type { ContextMenuItem as ContextMenuItemType } from "./Nodes/BaseNode/ContextMenu";
import ContextMenu from "./Nodes/BaseNode/ContextMenu";
import type { CategoryNodeProps } from "./Nodes/CategoryNode";
import type { BreakthroughNodeProps } from "./Nodes/BreakthroughNode";

// Add custom styles for the canvas background
const canvasBackgroundStyle = {
  light: {
    backgroundColor: "#ffffff",
    backgroundImage:
      "radial-gradient(rgba(209, 213, 219, 0.5) 1px, transparent 1px), radial-gradient(rgba(209, 213, 219, 0.3) 1px, transparent 1px)",
    backgroundSize: "20px 20px, 24px 24px",
    backgroundPosition: "0 0, 12px 12px",
  },
  dark: {
    backgroundColor: "#1F2937",
    backgroundImage:
      "radial-gradient(rgba(55, 65, 81, 0.15) 1px, transparent 1px), radial-gradient(rgba(55, 65, 81, 0.1) 1px, transparent 1px)",
    backgroundSize: "20px 20px, 24px 24px",
    backgroundPosition: "0 0, 12px 12px",
  },
};

// Define the structure for the custom event
interface FocusNodeEvent extends CustomEvent {
  detail: {
    nodeId: string;
  };
}

// 工具函数：让节点居中并占据画布 30% 以上空间
function focusNodeWithScale({
  node,
  reactFlowInstance,
  duration = 800,
  minPercent = 0.3,
}: {
  node: FlowNode;
  reactFlowInstance: ReactFlowInstance;
  duration?: number;
  minPercent?: number;
}) {
  if (!node || !reactFlowInstance) return;
  // 获取画布容器尺寸
  const container = document.querySelector(".react-flow");
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const canvasWidth = containerRect.width;
  const canvasHeight = containerRect.height;

  // 获取节点 DOM 尺寸
  const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
  // 默认宽高
  let nodeWidth = 256;
  let nodeHeight = 120;
  if (nodeElement) {
    const rect = nodeElement.getBoundingClientRect();
    nodeWidth = rect.width;
    nodeHeight = rect.height;
  }
  // 计算缩放比例
  const scaleX = canvasWidth / nodeWidth;
  const scaleY = canvasHeight / nodeHeight;
  // 目标缩放比例，使节点占据 minPercent 画布
  const zoom = Math.min(scaleX, scaleY) * minPercent;
  // 限制最大最小缩放
  const minZoom = 0.2;
  const maxZoom = 1.5;
  const finalZoom = Math.max(minZoom, Math.min(zoom, maxZoom));
  // 居中
  reactFlowInstance.setCenter(node.position.x, node.position.y, {
    zoom: finalZoom,
    duration,
  });
}

export const MindMap = () => {
  const { theme } = useTheme();
  const { canvases, currentCanvasId, addCanvas, updateCanvas } =
    useCanvasStore();
  const currentCanvas = canvases.find((c) => c.id === currentCanvasId);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    currentCanvas?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    currentCanvas?.edges || []
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const lastSelectedNodeIdRef = useRef<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const nodesRef = useRef(nodes);
  const [chatHistories, setChatHistories] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const expandNode = useCallback(
    (nodeId: string, forceExpand?: boolean) => {
      // First update the clicked node's expanded state
      let newExpandedState = false;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // If forceExpand is provided, use that value; otherwise toggle the current state
            newExpandedState =
              forceExpand !== undefined ? forceExpand : !node.data.isChildrenExpanded;
            return {
              ...node,
              data: {
                ...node.data,
                isChildrenExpanded: newExpandedState,
              },
            };
          }
          return node;
        })
      );

      // Get all descendant nodes recursively
      const getDescendantNodes = (
        parentId: string,
        allEdges: typeof edges
      ): string[] => {
        const directChildren = allEdges
          .filter((edge) => edge.source === parentId)
          .map((edge) => edge.target);
        const descendants = [...directChildren];
        for (const childId of directChildren) {
          descendants.push(...getDescendantNodes(childId, allEdges));
        }

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
            const isDirectChild = edges.some(
              (edge) => edge.source === nodeId && edge.target === node.id
            );

            return {
              ...node,
              hidden: !newExpandedState || !isDirectChild,
              data: {
                ...node.data,
                isChildrenExpanded: false, // Collapse all descendants when parent is collapsed
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
      const nodesWithHandlers = currentCanvas.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          expandNode: expandNode,
        },
      }));
      setNodes(nodesWithHandlers);
      setEdges(currentCanvas.edges);
    }
  }, [currentCanvas, setNodes, setEdges, expandNode]);

  // Effect to check if any nodes are outside viewport and fit view when needed
  useEffect(() => {
    if (!reactFlowInstance || nodes.length === 0) return;

    // Auto-fit nodes when they might be outside the viewport
    // We add a small delay to ensure the nodes have been rendered
    const timeoutId = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.1, duration: 400 });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [reactFlowInstance, nodes.length]);

  const handleNodeSelect = useCallback((node: FlowNode | null, autoFocus = false) => {
    setSelectedNodeId(node ? node.id : null);
    if (node) {
      lastSelectedNodeIdRef.current = node.id;
      if (autoFocus && reactFlowInstance) {
        focusNodeWithScale({ node, reactFlowInstance, duration: 600 });
      }
    }
  }, [reactFlowInstance]);

  const onNodeClick = useCallback(
    (event: MouseEvent, node: FlowNode) => {
      event.stopPropagation();
      // Only show right panel for nodes that have been populated with insights
      if (
        node.data.summary &&
        node.data.summary !==
          "Click to start a conversation and explore insights"
      ) {
        handleNodeSelect(node, true);
        setIsPanelOpen(true);
        setSidebarExpanded(false);
      } else if (node.type === "breakthrough" && !node.data.summary) {
        // For new question nodes, expand the chat sidebar
        setSidebarExpanded(true);
      }
    },
    [handleNodeSelect]
  );

  const handleBackgroundClick = useCallback(() => {
    setIsPanelOpen(false);
    setSidebarExpanded(false);
  }, []);

  const createCustomNode = useCallback(() => {
    if (!reactFlowInstance) return;

    const transform = reactFlowInstance.toObject().viewport;
    const position = {
      x: (window.innerWidth / 2 - 100 - transform.x) / transform.zoom,
      y: (window.innerHeight / 2 - 50 - transform.y) / transform.zoom,
    };

    const newNodeId = `question-${Date.now()}`;
    const newNode: FlowNode = {
      id: newNodeId,
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
        isChildrenExpanded: false,
        isDetailExpanded: false,
      },
      draggable: true,
    };

    setNodes((nds) => [...nds, newNode]);
    // Only expand the sidebar for chat
    setSidebarExpanded(true);

    handleNodeSelect(newNode, true);
  }, [reactFlowInstance, expandNode, setNodes, handleNodeSelect]);

  const handleNewCanvas = useCallback(() => {
    addCanvas();
  }, [addCanvas]);

  const addChildNode = useCallback(
    (parentId: string, childData: NodeChildData) => {
      if (!reactFlowInstance) return;

      // Find parent node to position child appropriately
      const parentNode = nodes.find((node) => node.id === parentId);
      if (!parentNode) return;

      // Node dimensions (approximate)
      const nodeWidth = 280;
      const nodeHeight = 120;
      // Padding between nodes
      const padding = 80;

      // Function to check if two nodes overlap
      const nodesOverlap = (
        pos1: { x: number; y: number },
        pos2: { x: number; y: number }
      ) => {
        return (
          Math.abs(pos1.x - pos2.x) < nodeWidth + padding &&
          Math.abs(pos1.y - pos2.y) < nodeHeight + padding
        );
      };

      // Start with a position directly below the parent
      let childPosition = {
        x: parentNode.position.x,
        y: parentNode.position.y + nodeHeight + padding,
      };

      // Grid system for positioning - start at column 0
      let column = 0;
      let row = 0;
      let positionFound = false;

      // Keep trying positions until we find one that doesn't overlap
      while (!positionFound && row < 10) {
        // Limit to 10 rows to prevent infinite loop
        positionFound = true;

        // Check for overlap with all existing nodes
        for (const node of nodes) {
          if (nodesOverlap(childPosition, node.position)) {
            positionFound = false;
            break;
          }
        }

        if (!positionFound) {
          // Move to the next position in a grid-like pattern
          column++;

          // When we've tried 3 columns, move to the next row
          if (column > 2) {
            column = 0;
            row++;
          }

          // Calculate new position
          childPosition = {
            x:
              parentNode.position.x +
              column * (nodeWidth + padding) -
              nodeWidth,
            y: parentNode.position.y + (row + 1) * (nodeHeight + padding),
          };
        }
      }

      // Generate a unique ID for the new node
      const newNodeId = `${childData.nodeType}-${Date.now()}`;

      // Create the new node
      const newNode = {
        id: newNodeId,
        type:
          childData.nodeType === "content"
            ? "breakthrough"
            : childData.nodeType,
        position: childPosition,
        data: {
          ...childData,
          label: childData.title,
          isChildrenExpanded: false,
          isDetailExpanded: false,
        },
      };

      // Create an edge connecting parent to child
      const newEdge = {
        id: `e-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: "smoothstep",
      };

      // Add the new node and edge to state
      setNodes((nodes) => {
        const newNodes = [...nodes, newNode];
        setEdges((edges) => {
          const newEdges = [...edges, newEdge];
          // 同步到 store
          updateCanvas(currentCanvasId, newNodes, newEdges);
          return newEdges;
        });
        return newNodes;
      });

      // Focus on the new node
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            handleNodeSelect(newNode, true);
          }, 50);
        });
      });
    },
    [
      reactFlowInstance,
      nodes,
      setNodes,
      setEdges,
      handleNodeSelect,
      updateCanvas,
      currentCanvasId,
    ]
  );

  const handleAddKeyInsight = useCallback(
    (nodeId: string, insight: KeyInsight) => {
      console.log("MindMap handleAddKeyInsight called with:", {
        nodeId,
        insight,
      });
      setNodes((nds) => {
        const newNodes = nds.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data;
            const keyInsights: KeyInsight[] = Array.isArray(
              nodeData.keyInsights
            )
              ? nodeData.keyInsights
              : [];
            console.log("Current keyInsights:", keyInsights);
            // Find the insight by content since it's unique
            const existingInsightIndex = keyInsights.findIndex(
              (i) => i.content === insight.content
            );
            console.log("existingInsightIndex:", existingInsightIndex);

            let updatedInsights: KeyInsight[];
            if (existingInsightIndex !== -1) {
              // Update existing insight
              updatedInsights = [...keyInsights];
              updatedInsights[existingInsightIndex] = {
                ...updatedInsights[existingInsightIndex],
                visible: true,
              };
              console.log(
                "Updating existing insight:",
                updatedInsights[existingInsightIndex]
              );
            } else {
              // Add new insight with visible flag
              updatedInsights = [...keyInsights, { ...insight, visible: true }];
              console.log("Adding new insight:", insight);
            }

            // Create updated node with expanded state set to true
            const updatedNode = {
              ...node,
              data: {
                ...nodeData,
                keyInsights: updatedInsights,
                isChildrenExpanded: true,
                isDetailExpanded: true,
              },
            };

            // Always expand the node when showing an insight, regardless of current state
            console.log("Expanding node:", nodeId);
            // Use setTimeout to ensure the DOM has updated with new content before expanding
            setTimeout(() => {
              expandNode(nodeId, true);
              // Trigger another expansion after a delay to ensure full content visibility
              // This helps with dynamic content that may still be rendering
              setTimeout(() => {
                expandNode(nodeId, true);
                // --- 修改为 focusNodeWithScale ---
                if (reactFlowInstance) {
                  focusNodeWithScale({
                    node,
                    reactFlowInstance,
                    duration: 400,
                  });
                }
              }, 200);
            }, 0);

            console.log("Updated node:", updatedNode);
            return updatedNode;
          }
          return node;
        });

        console.log("New nodes state:", newNodes);
        return newNodes;
      });
    },
    [expandNode, reactFlowInstance, setNodes]
  );

  const handleRemoveKeyInsight = useCallback(
    (nodeId: string, insightIndex: number) => {
      console.log("MindMap handleRemoveKeyInsight called with:", {
        nodeId,
        insightIndex,
      });
      setNodes((nds) => {
        const newNodes = nds.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data;
            const keyInsights: KeyInsight[] = Array.isArray(
              nodeData.keyInsights
            )
              ? nodeData.keyInsights
              : [];
            console.log("Current keyInsights:", keyInsights);
            console.log(
              "Insight at index:",
              insightIndex,
              keyInsights[insightIndex]
            );

            // Make sure the index exists
            if (keyInsights[insightIndex]) {
              const updatedInsights = [...keyInsights];
              updatedInsights[insightIndex] = {
                ...updatedInsights[insightIndex],
                visible: false,
              };
              console.log("Updated insight:", updatedInsights[insightIndex]);

              const updatedNode = {
                ...node,
                data: {
                  ...nodeData,
                  keyInsights: updatedInsights,
                  isChildrenExpanded: false,
                  isDetailExpanded: false,
                },
              };
              console.log("Updated node:", updatedNode);
              return updatedNode;
            }

            console.error(
              "Invalid insight index:",
              insightIndex,
              "for keyInsights:",
              keyInsights
            );
          }
          return node;
        });

        console.log("New nodes state:", newNodes);
        return newNodes;
      });
    },
    [setNodes]
  );

  // Auto-expand nodes with visible key insights, even if they were manually collapsed
  useEffect(() => {
    // This effect ensures that any node with visible key insights remains expanded
    // Find all nodes with visible insights that are currently collapsed
    const collapsedNodesWithVisibleInsights = nodes.filter((node) => {
      // Skip if already expanded
      if (node.data.isChildrenExpanded) return false;

      // Check if the node has visible key insights
      const keyInsights: KeyInsight[] = Array.isArray(node.data.keyInsights)
        ? node.data.keyInsights
        : [];
      return keyInsights.some(
        (insight: KeyInsight) => insight.visible === true
      );
    });

    // Auto-expand any nodes that have visible insights but are collapsed
    if (collapsedNodesWithVisibleInsights.length > 0) {
      console.log(
        "Auto-expanding nodes with visible insights:",
        collapsedNodesWithVisibleInsights
      );

      // Expand each node
      for (const node of collapsedNodesWithVisibleInsights) {
        setTimeout(() => {
          expandNode(node.id, true);
        }, 0);
      }
    }
  }, [nodes, expandNode]);

  const handleAddNodeFromPreview = useCallback(
    (nodeData: NodeData) => {
      // 优先用 selectedNodeId，否则用 lastSelectedNodeIdRef.current
      const parentId = selectedNodeId || lastSelectedNodeIdRef.current;
      if (!parentId) {
        alert("请先在画布上选择一个父节点");
        return;
      }
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) {
        alert("父节点未找到");
        return;
      }
      // 组装 childData
      const childData = {
        ...nodeData,
        nodeType: "breakthrough",
        type: "breakthrough",
        title: nodeData.title || "New Node",
        label: nodeData.title || "New Node",
        description: nodeData.summary || "",
      };
      addChildNode(parent.id, childData);
    },
    [selectedNodeId, nodes, addChildNode]
  );

  useEffect(() => {
    const handleFocusNode = (event: FocusNodeEvent) => {
      if (!reactFlowInstance) return;

      const nodeId = event.detail.nodeId;
      const node = nodes.find((n) => n.id === nodeId);

      if (node) {
        // --- 修改为 focusNodeWithScale ---
        focusNodeWithScale({ node, reactFlowInstance, duration: 800 });
        handleNodeSelect(node, true);
        setIsPanelOpen(true);
      }
    };

    window.addEventListener("focusNode", handleFocusNode as EventListener);
    return () =>
      window.removeEventListener("focusNode", handleFocusNode as EventListener);
  }, [reactFlowInstance, nodes, handleNodeSelect]);

  // 渲染时获取最新 node
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) || null
    : null;

  // 修改：详情展开/收起
  const toggleDetailExpandedRef = useRef((nodeId: string, isExpanded: boolean) => {
    setNodes((nds) =>
      nds.map((node) => {
        // 如果节点 ID 不匹配或者状态没有变化，直接返回原节点
        if (node.id !== nodeId || node.data.isDetailExpanded === isExpanded) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            isDetailExpanded: isExpanded,
          },
        };
      })
    );
  });

  const toggleDetailExpanded = useCallback((nodeId: string, isExpanded: boolean) => {
    toggleDetailExpandedRef.current(nodeId, isExpanded);
  }, []); // 现在不再依赖 setNodes

  const handleDeleteNode = useCallback((nodeId: string) => {
    // 递归获取所有子节点
    const getAllDescendants = (id: string, allEdges: typeof edges): string[] => {
      const directChildren = allEdges.filter(e => e.source === id).map(e => e.target);
      let all = [...directChildren];
      for (const child of directChildren) {
        all = all.concat(getAllDescendants(child, allEdges));
      }
      return all;
    };
    const toDelete = [nodeId, ...getAllDescendants(nodeId, edges)];
    setNodes(nds => nds.filter(n => !toDelete.includes(n.id)));
    setEdges(eds => eds.filter(e => !toDelete.includes(e.source) && !toDelete.includes(e.target)));
    // 同步到 store
    updateCanvas(currentCanvasId, nodes.filter(n => !toDelete.includes(n.id)), edges.filter(e => !toDelete.includes(e.source) && !toDelete.includes(e.target)));
  }, [edges, nodes, setNodes, setEdges, updateCanvas, currentCanvasId]);

  // --- handler ref 优化 ---
  const addChildNodeRef = useRef(addChildNode);
  const handleAddKeyInsightRef = useRef(handleAddKeyInsight);
  const handleRemoveKeyInsightRef = useRef(handleRemoveKeyInsight);
  const handleAddNodeFromPreviewRef = useRef(handleAddNodeFromPreview);

  useEffect(() => {
    addChildNodeRef.current = addChildNode;
  }, [addChildNode]);
  useEffect(() => {
    handleAddKeyInsightRef.current = handleAddKeyInsight;
  }, [handleAddKeyInsight]);
  useEffect(() => {
    handleRemoveKeyInsightRef.current = handleRemoveKeyInsight;
  }, [handleRemoveKeyInsight]);
  useEffect(() => {
    handleAddNodeFromPreviewRef.current = handleAddNodeFromPreview;
  }, [handleAddNodeFromPreview]);

  // 新增：用 useRef 保持 toggleDetailExpanded 和 setContextMenu 的引用
  const toggleDetailExpandedHandlerRef = useRef(toggleDetailExpanded);
  const setContextMenuHandlerRef = useRef(setContextMenu);
  useEffect(() => {
    toggleDetailExpandedHandlerRef.current = toggleDetailExpanded;
  }, [toggleDetailExpanded]);
  useEffect(() => {
    setContextMenuHandlerRef.current = setContextMenu;
  }, []);

  // 用 useMemo 创建 nodeTypes，依赖项为空，节点组件通过 ref.current 调用 handler
  const nodeTypes = useMemo(
    () => ({
      category: (props: NodeProps) => (
        <CategoryNode
          {...(props as CategoryNodeProps)}
          isDetailExpanded={!!props.data.isDetailExpanded}
          isChildrenExpanded={!!props.data.isChildrenExpanded}
          toggleDetailExpanded={(nodeId, expanded) =>
            toggleDetailExpandedHandlerRef.current(nodeId, expanded)
          }
          onNodeContextMenu={(...args) =>
            setContextMenuHandlerRef.current(...args)
          }
        />
      ),
      breakthrough: (props: NodeProps) => (
        <BreakthroughNode
          {...(props as BreakthroughNodeProps)}
          isDetailExpanded={!!props.data.isDetailExpanded}
          isChildrenExpanded={!!props.data.isChildrenExpanded}
          toggleDetailExpanded={(nodeId, expanded) =>
            toggleDetailExpandedHandlerRef.current(nodeId, expanded)
          }
          onNodeContextMenu={(...args) =>
            setContextMenuHandlerRef.current(...args)
          }
        />
      ),
    }),
    []
  );

  return (
    <div className="relative flex h-full w-full">
      <Sidebar
        onAddNode={createCustomNode}
        onNewCanvas={handleNewCanvas}
        isExpanded={sidebarExpanded}
        onToggleExpanded={setSidebarExpanded}
        onAddNodeFromPreview={(data) => {
          // Ensure data has the required id property for KeyInsight
          const nodeData = {
            ...data,
            keyInsights: data.keyInsights?.map((insight) => ({
              ...insight,
              id: insight.id || crypto.randomUUID(),
            })),
          };
          handleAddNodeFromPreview(nodeData);
        }}
        chatHistories={chatHistories}
        setChatHistories={setChatHistories}
      />
      <div
        className="flex-1"
        style={
          theme === "dark"
            ? canvasBackgroundStyle.dark
            : canvasBackgroundStyle.light
        }
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
            color={
              theme === "dark"
                ? "rgba(55, 65, 81, 0.1)"
                : "rgba(209, 213, 219, 0.3)"
            }
            gap={24}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls className="m-2 text-gray-500 dark:text-gray-100" />
        </ReactFlow>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={(() => {
              const node = nodes.find(n => n.id === contextMenu.nodeId);
              if (!node) return [];
              return [
                {
                  label: node.data.isDetailExpanded ? "收起详细信息" : "展开详细信息",
                  onClick: () => {
                    console.log('toggleDetailExpanded', node.id);
                    toggleDetailExpanded(node.id, !node.data.isDetailExpanded);
                  },
                },
                {
                  label: node.data.isChildrenExpanded ? "收起子节点" : "展开子节点",
                  onClick: () => {
                    console.log('expandNode', node.id);
                    expandNode(node.id);
                  },
                },
                {
                  label: "删除节点",
                  onClick: () => {
                    console.log('handleDeleteNode', node.id);
                    handleDeleteNode(node.id);
                  },
                },
              ];
            })() as ContextMenuItemType[]}
          />
        )}
      </div>
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        node={selectedNode}
        expandNode={expandNode}
        onAddKeyInsight={(nodeId, insight) => handleAddKeyInsightRef.current(nodeId, insight)}
        onRemoveKeyInsight={(nodeId, insightIndex) => handleRemoveKeyInsightRef.current(nodeId, insightIndex)}
        onAddNodeFromPreview={(data) => handleAddNodeFromPreviewRef.current(data)}
        chatHistories={chatHistories}
        setChatHistories={setChatHistories}
        toggleDetailExpanded={toggleDetailExpanded}
      />
    </div>
  );
};
