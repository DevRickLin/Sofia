import type React from "react";
import { useState } from "react";
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
  CaretUp,
  Plus,
  Minus,
} from "@phosphor-icons/react";
import { generateChatResponse } from "../../services/mock2";
import type { ChatMessage } from "../../services/mock2";
import type { A2AClient } from "a2a-client";
import type { NodeData, KeyInsight } from "../MindMap/types";
import ChatHistory from "./ChatHistory";
import { Rnd } from "react-rnd";

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
}: SidePanelProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredInsightId, setHoveredInsightId] = useState<string | null>(null);

  // Get current chat history for the selected node
  const currentChatHistory = node ? chatHistories[node.id] || [] : [];

  if (!node) return null;

  const data = node.data;

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
        <Rnd
          default={{
            x: window.innerWidth - 400,
            y: 60,
            width: 360,
            height: 600,
          }}
          minWidth={320}
          minHeight={300}
          bounds="window"
          dragHandleClassName="drag-handle"
          enableResizing={{
            right: true,
            bottom: true,
            bottomRight: true,
          }}
          style={{ zIndex: 100 }}
        >
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 w-full sm:w-80 h-full bg-white shadow-xl rounded-l-xl flex flex-col z-50"
            style={{ height: "100%" }}
          >
            <div className="p-4 overflow-y-auto drag-handle" style={{ minHeight: 220, maxHeight: 320, cursor: "move" }}>
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
                    <div className="mt-2 space-y-3">
                      {data.keyInsights.map(
                        (insight: KeyInsight, index: number) => (
                          <div
                            key={
                              insight.id ||
                              `insight-${insight.content.substring(
                                0,
                                10
                              )}-${index}`
                            }
                            className={`relative rounded p-2 ${
                              insight.visible
                                ? "bg-sky-100 border-l-2 border-sky-500"
                                : "bg-sky-50"
                            }`}
                            onMouseEnter={() =>
                              setHoveredInsightId(insight.id)
                            }
                            onMouseLeave={() => setHoveredInsightId(null)}
                          >
                            <div
                              className="absolute right-2 top-2 z-10 flex flex-col gap-1"
                              style={{
                                opacity:
                                  hoveredInsightId === insight.id ? 1 : 0,
                                transition: "opacity 0.15s ease-in-out",
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddKeyInsight(insight);
                                }}
                                className={`p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 ${
                                  insight.visible
                                    ? "opacity-50"
                                    : "opacity-100"
                                }`}
                                title="Show in mindmap"
                              >
                                <Plus className="h-3 w-3" weight="bold" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (node) {
                                    handleRemoveKeyInsight(index);
                                  }
                                }}
                                className={`p-1 rounded-full bg-sky-200 hover:bg-sky-300 text-sky-600 ${
                                  !insight.visible
                                    ? "opacity-50"
                                    : "opacity-100"
                                }`}
                                title="Hide from mindmap"
                              >
                                <Minus className="h-3 w-3" weight="bold" />
                              </button>
                            </div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-8">
                                <p className="text-xs text-sky-700">
                                  {insight.content}
                                </p>
                                <p className="mt-1 text-xs text-sky-600 italic">
                                  {insight.implications}
                                </p>
                                {insight.relatedTechnologies &&
                                  insight.relatedTechnologies.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {insight.relatedTechnologies.map(
                                        (tech) => (
                                          <span
                                            key={`tech-${tech}`}
                                            className="inline-block bg-sky-100 text-[10px] px-1.5 py-0.5 rounded-full text-sky-700"
                                          >
                                            {tech}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                            {insight.visible && (
                              <div className="mt-1 text-[10px] text-sky-600 font-medium flex items-center">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1" />
                                Visible in mindmap
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {expandNode && (
                  <button
                    type="button"
                    onClick={() => expandNode(node.id)}
                    className="mt-3 px-3 py-1.5 bg-sky-100 text-sky-700 rounded text-xs font-medium hover:bg-sky-200 transition-colors w-full"
                  >
                    {data.isExpanded ? "Hide" : "Show"} Details
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 flex flex-col flex-1 min-h-0">
              <button
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
                  <X
                    weight="bold"
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                  />
                ) : (
                  <CaretUp
                    weight="bold"
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                  />
                )}
              </button>
              {isChatOpen && node && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-1 min-h-0 overflow-y-auto">
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
                </div>
              )}
            </div>
          </motion.div>
        </Rnd>
      )}
    </AnimatePresence>
  );
}
