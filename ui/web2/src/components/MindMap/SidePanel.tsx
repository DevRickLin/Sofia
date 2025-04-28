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
    PaperPlaneTilt as Send,
    ChatTeardropDots as MessageSquare,
    Spinner as Loader2,
    CaretUp,
    Plus,
    Minus,
} from "@phosphor-icons/react";
import { generateChatResponse } from "../../services/openai";
import { useA2AClient } from "../../context/A2AClientContext";
import type { NodeData, KeyInsight } from "../MindMap/types";

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    node: Node<NodeData> | null;
    expandNode?: (nodeId: string) => void;
    onAddKeyInsight?: (nodeId: string, insight: KeyInsight) => void;
    onRemoveKeyInsight?: (nodeId: string, insightIndex: number) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen,
    onClose,
    node,
    expandNode,
    onAddKeyInsight,
    onRemoveKeyInsight,
}) => {
    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState<
        Array<{ type: "user" | "assistant"; content: string; id: string }>
    >([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredInsightId, setHoveredInsightId] = useState<string | null>(null);
    const { client } = useA2AClient();

    if (!node || !client) return null;

    const data = node.data;

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading) return;

        const userQuestion = question.trim();
        setQuestion("");
        setChatHistory((prev) => [
            ...prev,
            { type: "user", content: userQuestion, id: `user-${Date.now()}` },
        ]);

        setIsLoading(true);
        try {
            const response = await generateChatResponse(client, data, userQuestion, setChatHistory);
            setChatHistory((prev) => [
                ...prev,
                { type: "assistant", content: response, id: `assistant-${Date.now()}` },
            ]);
        } catch (error) {
            console.error("Error:", error);
            setChatHistory((prev) => [
                ...prev,
                {
                    type: "assistant",
                    content:
                        "I apologize, but I encountered an error while processing your request.",
                    id: `error-${Date.now()}`
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddKeyInsight = (insight: KeyInsight) => {
        console.log('Adding insight:', insight);
        if (onAddKeyInsight && node) {
            const insightToAdd = {
                ...insight,
                id: insight.id || `insight-${Date.now()}`
            };
            console.log('Calling onAddKeyInsight with:', node.id, insightToAdd);
            onAddKeyInsight(node.id, insightToAdd);
        } else {
            console.log('onAddKeyInsight or node is null:', { onAddKeyInsight, node });
        }
    };

    const handleRemoveKeyInsight = (index: number) => {
        console.log('Removing insight at index:', index);
        if (onRemoveKeyInsight && node) {
            // Check if the key insights array exists and has elements
            const keyInsights = node.data.keyInsights || [];
            if (index >= 0 && index < keyInsights.length) {
                const insight = keyInsights[index];
                console.log('Found insight to remove:', insight);
                console.log('Insight visible status:', insight.visible);
                console.log('Calling onRemoveKeyInsight with:', node.id, index);
                onRemoveKeyInsight(node.id, index);
            } else {
                console.error('Invalid index for keyInsights:', index, keyInsights);
            }
        } else {
            console.log('onRemoveKeyInsight or node is null:', { onRemoveKeyInsight, node });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute top-0 right-0 w-full sm:w-80 h-full bg-white dark:bg-gray-800 shadow-xl rounded-l-xl flex flex-col z-50"
                >
                    <div className="p-4 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-start">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                {data.title || data.label || "Details"}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {node.type === "category" && (
                                <>
                                    <div>
                                        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            {data.label}
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                            {data.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Related Breakthroughs
                                        </h4>
                                        {data.relatedBreakthroughs ? (
                                            <ul className="mt-2 space-y-1">
                                                {data.relatedBreakthroughs.map(
                                                    (breakthrough: string, index: number) => (
                                                        <li
                                                            key={`breakthrough-${breakthrough.substring(0, 10)}-${index}`}
                                                            className="flex items-start"
                                                        >
                                                            <ArrowRight className="h-3 w-3 text-emerald-500 mt-0.5 mr-1 flex-shrink-0" />
                                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                                {breakthrough}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                                Use the expand button below the node to see related breakthroughs
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {data.date && data.organization && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        <span className="text-xs">{data.date}</span>
                                    </div>
                                    <div className="mt-1 flex items-center text-gray-500 dark:text-gray-400">
                                        <Building className="h-3 w-3 mr-1" />
                                        <span className="text-xs">
                                            {data.organization}
                                        </span>
                                    </div>

                                    {data.source && (
                                        <div className="mt-1 flex items-center text-gray-500 dark:text-gray-400">
                                            <Globe className="h-3 w-3 mr-1" />
                                            <a
                                                href={data.source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-sky-500 hover:text-sky-700 dark:hover:text-sky-300"
                                            >
                                                View Source
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Summary
                                </h4>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                    {data.summary}
                                </p>
                            </div>

                            {data.details && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Details
                                    </h4>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                                        {data.details}
                                    </p>
                                </div>
                            )}

                            {data.keyInsights && data.keyInsights.length > 0 && (
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                        <Lightbulb className="h-3 w-3 mr-1" />
                                        Key Insights
                                    </h4>
                                    <div className="mt-2 space-y-3">
                                        {data.keyInsights.map((insight: KeyInsight, index: number) => (
                                            <div
                                                key={insight.id || `insight-${insight.content.substring(0, 10)}-${index}`}
                                                className={`relative rounded p-2 ${
                                                    insight.visible 
                                                    ? "bg-sky-100 dark:bg-sky-800/30 border-l-2 border-sky-500" 
                                                    : "bg-sky-50 dark:bg-sky-900/20"
                                                }`}
                                                onMouseEnter={() => setHoveredInsightId(insight.id)}
                                                onMouseLeave={() => setHoveredInsightId(null)}
                                            >
                                                {/* Control buttons that appear on hover */}
                                                <div 
                                                    className="absolute right-2 top-2 z-10 flex flex-col gap-1"
                                                    style={{ 
                                                        opacity: hoveredInsightId === insight.id ? 1 : 0,
                                                        transition: 'opacity 0.15s ease-in-out'
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddKeyInsight(insight);
                                                        }}
                                                        className={`p-1 rounded-full bg-sky-100 hover:bg-sky-200 dark:bg-sky-800/20 dark:hover:bg-sky-700 text-sky-600 dark:text-sky-300 ${
                                                            insight.visible ? 'opacity-50' : 'opacity-100'
                                                        }`}
                                                        title="Show in mindmap"
                                                    >
                                                        <Plus className="h-3 w-3" weight="bold" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            console.log("Minus button clicked for insight:", index, insight);
                                                            console.log("Event target:", e.target);
                                                            console.log("Event currentTarget:", e.currentTarget);
                                                            console.log("Insight visible status:", insight.visible);
                                                            if (node) {
                                                                console.log("Node ID:", node.id);
                                                                handleRemoveKeyInsight(index);
                                                            }
                                                        }}
                                                        className={`p-1 rounded-full bg-sky-200 hover:bg-sky-300 dark:bg-sky-700 dark:hover:bg-sky-600 text-sky-600 dark:text-sky-300 ${
                                                            !insight.visible ? 'opacity-50' : 'opacity-100'
                                                        }`}
                                                        title="Hide from mindmap"
                                                    >
                                                        <Minus className="h-3 w-3" weight="bold" />
                                                    </button>
                                                </div>
                                                
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-8">
                                                        <p className="text-xs text-sky-700 dark:text-sky-300">
                                                            {insight.content}
                                                        </p>

                                                        <p className="mt-1 text-xs text-sky-600 dark:text-sky-400 italic">
                                                            {insight.implications}
                                                        </p>

                                                        {insight.relatedTechnologies && insight.relatedTechnologies.length > 0 && (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {insight.relatedTechnologies.map((tech, techIndex) => (
                                                                    <span
                                                                        key={techIndex}
                                                                        className="inline-block bg-sky-100 dark:bg-sky-900/40 text-[10px] px-1.5 py-0.5 rounded-full text-sky-700 dark:text-sky-300"
                                                                    >
                                                                        {tech}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {insight.visible && (
                                                    <div className="mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium flex items-center">
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1"></span>
                                                        Visible in mindmap
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {expandNode && (
                                <button
                                    onClick={() => expandNode(node.id)}
                                    className="mt-3 px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded text-xs font-medium hover:bg-sky-200 dark:hover:bg-sky-800/40 transition-colors w-full"
                                >
                                    {data.isExpanded ? 'Hide' : 'Show'} Details
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                                isChatOpen 
                                ? 'bg-gray-50 dark:bg-gray-700/30 shadow-inner' 
                                : 'bg-white dark:bg-gray-800'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                                    <MessageSquare 
                                        weight="bold"
                                        className="h-4 w-4 text-sky-600 dark:text-sky-400" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Ask Follow-up Questions
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Get more insights about this topic
                                    </span>
                                </div>
                            </div>
                            {isChatOpen ? (
                                <X 
                                    weight="bold"
                                    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" 
                                />
                            ) : (
                                <CaretUp 
                                    weight="bold"
                                    className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" 
                                />
                            )}
                        </button>

                        {isChatOpen && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                                <div className="mb-4 max-h-40 overflow-y-auto space-y-3">
                                    {chatHistory.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${
                                                message.type === "user"
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded px-3 py-1.5 ${
                                                    message.type === "user"
                                                        ? "bg-[#dbf9fe] text-gray-900"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                }`}
                                            >
                                                <p className="text-xs whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-1.5">
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form
                                    onSubmit={handleQuestionSubmit}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="Ask a follow-up question..."
                                        className="flex-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-500 focus:border-transparent dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        className={`px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isLoading
                                                ? "cursor-not-allowed"
                                                : "hover:bg-sky-600 hover:shadow-md"
                                        }`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SidePanel;
