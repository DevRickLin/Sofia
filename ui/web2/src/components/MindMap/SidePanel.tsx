import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Node } from "@xyflow/react";
import {
  X,
  Calendar,
  Building,
  Globe,
  ArrowRight,
  Lightbulb,
  ChatTeardropDots as MessageSquare,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { generateChatResponse } from "../../services/mock2";
import type { ChatMessage } from "../../services/mock2";
import type { A2AClient } from "a2a-client";
import type { NodeData, KeyInsight } from "../MindMap/types";
import ChatHistory from "./ChatHistory";
import KeyInsightList from "./KeyInsightList";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<NodeData> | null;
  expandNode: (nodeId: string) => void;
  onAddKeyInsight?: (nodeId: string, insight: KeyInsight) => void;
  onRemoveKeyInsight?: (nodeId: string, insightIndex: number) => void;
  onAddNodeFromPreview?: (data: NodeData) => void;
  chatHistories: Record<string, ChatMessage[]>;
  setChatHistories: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  toggleDetailExpanded?: (nodeId: string, isExpanded: boolean) => void;
}

export interface NodeChildData {
  title: string;
  label?: string;
  description: string;
  nodeType: string;
  type: string;
}

export default function SidePanel({
  isOpen,
  onClose,
  node,
  expandNode,
  onAddKeyInsight,
  onRemoveKeyInsight,
  onAddNodeFromPreview,
  chatHistories,
  setChatHistories,
  toggleDetailExpanded,
}: SidePanelProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [upperSectionHeight, setUpperSectionHeight] = useState(60); // Percentage height for upper section
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDraggingRef = useRef(false);

  // Get current chat history for the selected node
  const currentChatHistory = node ? chatHistories[node.id] || [] : [];

  // Effect to adjust heights when chat is toggled
  useEffect(() => {
    // This will run after the DOM has been updated
    if (buttonRef.current && containerRef.current) {
      // Add a small timeout to ensure measurements are accurate after DOM updates
      const timer = setTimeout(() => {
        // This ensures we have the latest measurements
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const relativeY = moveEvent.clientY - containerRect.top;
      
      // Calculate percentage (clamped between 20% and 80%)
      const percentage = Math.max(20, Math.min(80, (relativeY / containerHeight) * 100));
      setUpperSectionHeight(percentage);
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!node) return null;

  const data = node.data;
  const buttonHeight = buttonRef.current?.clientHeight || 60; // Default height as fallback

  const handleAddKeyInsight = (insight: KeyInsight) => {
    console.log("Adding insight:", insight);
    if (onAddKeyInsight && node) {
      const insightToAdd = {
        ...insight,
        id: insight.id || `insight-${Date.now()}`,
      };
      console.log("Calling onAddKeyInsight with:", node.id, insightToAdd);
      onAddKeyInsight(node.id, insightToAdd);
    } else {
      console.log("onAddKeyInsight or node is null:", {
        onAddKeyInsight,
        node,
      });
    }
  };

  const handleRemoveKeyInsight = (index: number) => {
    console.log("Removing insight at index:", index);
    if (onRemoveKeyInsight && node) {
      // Check if the key insights array exists and has elements
      const keyInsights = node.data.keyInsights || [];
      if (index >= 0 && index < keyInsights.length) {
        const insight = keyInsights[index];
        console.log("Found insight to remove:", insight);
        console.log("Insight visible status:", insight.visible);
        console.log("Calling onRemoveKeyInsight with:", node.id, index);
        onRemoveKeyInsight(node.id, index);
      } else {
        console.error("Invalid index for keyInsights:", index, keyInsights);
      }
    } else {
      console.log("onRemoveKeyInsight or node is null:", {
        onRemoveKeyInsight,
        node,
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl flex flex-col z-50 border-l border-gray-200"
        >
          <motion.div 
            className="p-4 overflow-y-auto"
            style={{
              height: isChatOpen ? `${upperSectionHeight}%` : `calc(100% - ${buttonHeight}px)`,
              flex: isChatOpen ? undefined : undefined
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-base font-bold text-gray-900">
                {data.title || data.label || "Details"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {node.type === "category" && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-600">
                      {data.label}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      {data.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-medium text-gray-500">
                      Related Breakthroughs
                    </h4>
                    {data.relatedBreakthroughs ? (
                      <ul className="mt-2 space-y-1">
                        {data.relatedBreakthroughs.map(
                          (breakthrough: string, index: number) => (
                            <li
                              key={`breakthrough-${breakthrough.substring(
                                0,
                                10
                              )}-${index}`}
                              className="flex items-start"
                            >
                              <ArrowRight className="h-3 w-3 text-emerald-500 mt-0.5 mr-1 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                {breakthrough}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Use the expand button below the node to see related
                        breakthroughs
                      </p>
                    )}
                  </div>
                </>
              )}
              {data.date && data.organization && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="text-xs">{data.date}</span>
                  </div>
                  <div className="mt-1 flex items-center text-gray-500">
                    <Building className="h-3 w-3 mr-1" />
                    <span className="text-xs">{data.organization}</span>
                  </div>
                  {data.source && (
                    <div className="mt-1 flex items-center text-gray-500">
                      <Globe className="h-3 w-3 mr-1" />
                      <a
                        href={data.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-500 hover:text-sky-700"
                      >
                        View Source
                      </a>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500">
                  Summary
                </h4>
                <p className="mt-1 text-xs text-gray-600">
                  {data.summary}
                </p>
              </div>
              {data.details && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500">
                    Details
                  </h4>
                  <p className="mt-1 text-xs text-gray-600">
                    {data.details}
                  </p>
                </div>
              )}
              {data.keyInsights && data.keyInsights.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 flex items-center">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Key Insights
                  </h4>
                  <KeyInsightList
                    keyInsights={data.keyInsights}
                    isAdded={false}
                    onAddKeyInsight={handleAddKeyInsight}
                    onRemoveKeyInsight={(insight) => {
                      // 找到 index
                      const idx = data.keyInsights?.findIndex(i => i.id === insight.id);
                      if (idx !== undefined && idx >= 0) handleRemoveKeyInsight(idx);
                    }}
                  />
                </div>
              )}
              {toggleDetailExpanded && (
                <button
                  type="button"
                  onClick={() => toggleDetailExpanded(node.id, !node.data.isDetailExpanded)}
                  className="mt-3 px-3 py-1.5 bg-sky-100 text-sky-700 rounded text-xs font-medium hover:bg-sky-200 transition-colors w-full"
                >
                  {data.isDetailExpanded ? "Hide" : "Show"} Details
                </button>
              )}
              {!toggleDetailExpanded && expandNode && (
                <button
                  type="button"
                  onClick={() => expandNode(node.id)}
                  className="mt-3 px-3 py-1.5 bg-sky-100 text-sky-700 rounded text-xs font-medium hover:bg-sky-200 transition-colors w-full"
                >
                  {data.isChildrenExpanded ? "Hide" : "Show"} Children
                </button>
              )}
            </div>
          </motion.div>
          
          {/* Resizable handle */}
          {isChatOpen && (
            <div 
              className="h-2 bg-gray-100 hover:bg-gray-300 cursor-ns-resize flex items-center justify-center"
              onMouseDown={handleResizeStart}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          <div className={`${isChatOpen ? 'flex flex-col flex-1' : ''} border-t border-gray-200`}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 ${
                isChatOpen
                  ? "bg-gray-50 shadow-inner"
                  : "bg-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50">
                  <MessageSquare
                    weight="bold"
                    className="h-4 w-4 text-sky-600"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    Ask Follow-up Questions
                  </span>
                  <span className="text-xs text-gray-500">
                    Get more insights about this topic
                  </span>
                </div>
              </div>
              {isChatOpen ? (
                <CaretUp
                  weight="bold"
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                />
              ) : (
                <CaretDown
                  weight="bold"
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                />
              )}
            </button>
            <AnimatePresence>
              {isChatOpen && node && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border-t border-gray-200 bg-gray-50 overflow-y-auto flex-1"
                >
                  <ChatHistory
                    history={currentChatHistory}
                    isLoading={isLoading}
                    onSend={async (userQuestion) => {
                      setIsLoading(true);
                      try {
                        await generateChatResponse(
                          {} as A2AClient,
                          data,
                          userQuestion,
                          (history) => {
                            setChatHistories((prev) => ({
                              ...prev,
                              [node.id]:
                                typeof history === "function"
                                  ? history(prev[node.id] || [])
                                  : history,
                            }));
                          }
                        );
                      } catch {
                        setChatHistories((prev) => ({
                          ...prev,
                          [node.id]: [
                            ...(prev[node.id] || []),
                            {
                              type: "assistant-answer",
                              content:
                                "I apologize, but I encountered an error while processing your request.",
                              id: `error-${Date.now()}`,
                            },
                          ],
                        }));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onAddNodeFromPreview={onAddNodeFromPreview}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
