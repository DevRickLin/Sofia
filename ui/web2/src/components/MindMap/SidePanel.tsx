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
    Brain,
} from "@phosphor-icons/react";
import { generateChatResponse } from "../../services/mock2";
import type { ChatMessage, ResponseCard } from "../../services/mock2";
import type { NodeData } from "../MindMap/types";
import type { A2AClient } from 'a2a-client';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    node: Node<NodeData> | null;
    expandNode: (nodeId: string) => void;
    addChildNode?: (parentId: string, data: NodeChildData) => void;
}

export interface NodeChildData {
    title: string;
    label?: string;
    description: string;
    nodeType: string;
    type: string;
}

// Theme colors for different card types
const cardThemes = {
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700'
    },
    insight: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-700'
    },
    summary: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-700'
    },
    action: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-700'
    }
};

const ResponseCardComponent: React.FC<{
    card: ResponseCard;
    onAdopt: (card: ResponseCard) => void;
}> = ({ card, onAdopt }) => {
    const theme = cardThemes[card.type];
    
    return (
        <div className={`${theme.bg} rounded p-2 border ${theme.border}`}>
            {card.title && (
                <h4 className={`text-xs font-medium ${theme.text} mb-1`}>
                    {card.title}
                </h4>
            )}
            <p className={`text-xs ${theme.text}`}>
                {card.content}
            </p>
            <div className="mt-2 flex justify-end">
                <button
                    type="button"
                    onClick={() => onAdopt(card)}
                    className={`text-[10px] px-2 py-0.5 rounded ${theme.bg} hover:bg-opacity-80 ${theme.text} border ${theme.border} flex items-center`}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Map
                </button>
            </div>
        </div>
    );
};

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen,
    onClose,
    node,
    expandNode,
    addChildNode,
}) => {
    const [question, setQuestion] = useState("");
    const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Get current chat history for the selected node
    const currentChatHistory = node ? (chatHistories[node.id] || []) : [];

    if (!node) return null;

    const data = node.data;

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading || !node) return;

        const userQuestion = question.trim();
        setQuestion("");
        setIsLoading(true);
        
        try {
            // Use our mock service to generate a response
            await generateChatResponse({} as A2AClient, data, userQuestion, (history) => {
                setChatHistories(prev => ({
                    ...prev,
                    [node.id]: typeof history === 'function' ? history(prev[node.id] || []) : history
                }));
            });
        } catch (error) {
            console.error("Error:", error);
            setChatHistories(prev => ({
                ...prev,
                [node.id]: [
                    ...(prev[node.id] || []),
                    {
                        type: "assistant-answer",
                        content: "I apologize, but I encountered an error while processing your request.",
                        id: `error-${Date.now()}`
                    },
                ]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdoptCard = (card: ResponseCard) => {
        if (addChildNode && node) {
            // Add the card content as a child node of the currently selected node
            addChildNode(node.id, {
                title: card.title || (card.type === 'insight' ? 'Insight' : card.type === 'summary' ? 'Summary' : 'Content'),
                label: card.title,
                description: card.content,
                nodeType: 'content',
                type: card.type
            });
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
                                                    (
                                                        breakthrough: string,
                                                        index: number
                                                    ) => (
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

                            {node.type === "breakthrough" && (
                                <>
                                    <div>
                                        <h3 className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                                            {data.title}
                                        </h3>

                                        <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            <span className="text-xs">
                                                {data.date}
                                            </span>
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

                                    {data.keyInsights &&
                                        data.keyInsights.length > 0 && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                                                    <Lightbulb className="h-3 w-3 mr-1" />
                                                    Key Insights
                                                </h4>
                                                <div className="mt-2 space-y-3">
                                                    {data.keyInsights.map(
                                                        (insight, index) => (
                                                            <div
                                                                key={insight.id || `insight-${insight.content.substring(0, 10)}-${index}`}
                                                                className="bg-sky-50 dark:bg-sky-900/20 rounded p-2"
                                                            >
                                                                <p className="text-xs text-sky-700 dark:text-sky-300">
                                                                    {
                                                                        insight.content
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-xs text-sky-600 dark:text-sky-400 italic">
                                                                    {
                                                                        insight.implications
                                                                    }
                                                                </p>

                                                                {insight.relatedTechnologies &&
                                                                    insight
                                                                        .relatedTechnologies
                                                                        .length >
                                                                        0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {insight.relatedTechnologies.map(
                                                                                (
                                                                                    tech: string
                                                                                ) => (
                                                                                    <span
                                                                                        key={`tech-${tech}`}
                                                                                        className="inline-block bg-sky-100 dark:bg-sky-800/40 text-[10px] px-1.5 py-0.5 rounded-full text-sky-700 dark:text-sky-300"
                                                                                    >
                                                                                        {
                                                                                            tech
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </>
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
                                    {currentChatHistory.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${
                                                message.type === "user"
                                                    ? "justify-end"
                                                    : "justify-start"
                                            } flex-col ${message.type !== "user" ? "w-full" : ""}`}
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
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) =>
                                            setQuestion(e.target.value)
                                        }
                                        placeholder="Ask about this breakthrough..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        disabled={isLoading}
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
