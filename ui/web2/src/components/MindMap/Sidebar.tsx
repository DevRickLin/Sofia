import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
    Plus,
    MapTrifold as MapIcon,
    Stack as Layers,
    CaretRight as ChevronRight,
    PaperPlaneTilt as Send,
    Spinner as Loader2,
    PencilSimpleLine as Edit2,
    MagnifyingGlass as Search,
    X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "../../store/canvasStore";
import { generateChatResponse } from "../../services/openai";
import { useA2AClient } from "../../context/A2AClientContext";

interface SidebarProps {
    onAddNode: () => void;
    onNewCanvas: () => void;
    isExpanded: boolean;
    onToggleExpanded: (expanded: boolean) => void;
}

interface KeyInsight {
    content: string;
    implications: string;
}

interface NodeData {
    title?: string;
    label?: string;
    description?: string;
    summary?: string;
    details?: string;
    keyInsights?: KeyInsight[];
}

const Sidebar: React.FC<SidebarProps> = ({
    onAddNode,
    onNewCanvas,
    isExpanded,
    onToggleExpanded,
}) => {
    const [showMapsDropdown, setShowMapsDropdown] = useState(false);
    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState<
        Array<{ type: "user" | "assistant"; content: string; id: string }>
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<
        Array<{
            id: string;
            title: string;
            type: string;
            content: string;
        }>
    >([]);

    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { canvases, currentCanvasId, setCurrentCanvas, updateCanvasName } =
        useCanvasStore();
    const currentCanvas = canvases.find((c) => c.id === currentCanvasId);
    const { client } = useA2AClient();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Handle search box
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
            }

            // Handle sidebar collapse
            if (
                isExpanded &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node)
            ) {
                const target = event.target as HTMLElement;
                // Don't collapse if clicking the toggle button or inside the sidebar
                if (!target.closest('.sidebar-toggle-button')) {
                    onToggleExpanded(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isExpanded, onToggleExpanded]);

    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    useEffect(() => {
        if (editingCanvasId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingCanvasId]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim() || !currentCanvas) {
            setSearchResults([]);
            return;
        }

        const results = currentCanvas.nodes
            .filter((node) => {
                const data = node.data as unknown as NodeData;
                const searchText = [
                    data.title || "",
                    data.label || "",
                    data.description || "",
                    data.summary || "",
                    data.details || "",
                    ...(data.keyInsights?.map(
                        (insight: KeyInsight) =>
                            `${insight.content} ${insight.implications}`
                    ) || []),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchText.includes(query.toLowerCase());
            })
            .map((node) => ({
                id: node.id,
                title: ((node.data as unknown as NodeData).title || (node.data as unknown as NodeData).label || "Untitled") as string,
                type: node.type || "unknown",
                content: ((node.data as unknown as NodeData).description || (node.data as unknown as NodeData).summary || "") as string,
            }));

        setSearchResults(results);
    };

    const handleSearchResultClick = (nodeId: string) => {
        if (window.dispatchEvent) {
            window.dispatchEvent(
                new CustomEvent("focusNode", { detail: { nodeId } })
            );
        }
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || isLoading || !client || !currentCanvas) return;

        const userQuestion = question.trim();
        setQuestion("");
        setChatHistory((prev) => [
            ...prev,
            { type: "user", content: userQuestion, id: `user-${Date.now()}` },
        ]);

        setIsLoading(true);
        try {
            // Create a NodeData object with relevant information from the canvas
            const canvasData = {
                title: currentCanvas.name,
                description: `This is a mind map called "${currentCanvas.name}"`,
                // Add any other relevant properties that might help the AI understand the context
            };
            
            await generateChatResponse(client, canvasData, userQuestion, setChatHistory);
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

    const handleCanvasNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCanvasId && editingName.trim()) {
            updateCanvasName(editingCanvasId, editingName.trim());
            setEditingCanvasId(null);
            setEditingName("");
        }
    };

    return (
        <div className="flex h-full" ref={sidebarRef}>
            <div className="w-12 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 shadow-sm">
                <div className="flex flex-col items-center space-y-3">
                    <button
                        type="button"
                        onClick={onAddNode}
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors group relative"
                        title="Add Free Node"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Add Free Node
                        </span>
                    </button>

                    <div 
                        className="relative" 
                        ref={searchRef}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setShowSearch(true);
                                setTimeout(() => {
                                    searchInputRef.current?.focus();
                                }, 100);
                            }}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors group relative"
                            title="Search"
                        >
                            <Search className="h-4 w-4" />
                            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Search
                            </span>
                        </button>

                        <AnimatePresence>
                            {showSearch && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-full top-0 ml-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-2">
                                        <div className="relative">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    handleSearch(e.target.value)
                                                }
                                                placeholder="Search mindmap..."
                                                className="w-full px-3 py-1.5 pl-8 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setShowSearch(false);
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                    }
                                                }}
                                            />
                                            <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400" />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery("");
                                                        setSearchResults([]);
                                                        searchInputRef.current?.focus();
                                                    }}
                                                    className="absolute right-2 top-1.5 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                                                >
                                                    <X className="h-3 w-3 text-gray-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="max-h-64 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                                            {searchResults.map((result) => (
                                                <button
                                                    type="button"
                                                    key={result.id}
                                                    onClick={() => {
                                                        handleSearchResultClick(result.id);
                                                        setShowSearch(false);
                                                    }}
                                                    className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                        {result.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {result.content}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && searchResults.length === 0 && (
                                        <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
                                            No results found
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {showSearch && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                            />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onNewCanvas}
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors group relative"
                        title="New Canvas"
                    >
                        <Layers className="h-4 w-4" />
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            New Canvas
                        </span>
                    </button>

                    <div
                        className="relative group"
                        onMouseEnter={() => setShowMapsDropdown(true)}
                        onMouseLeave={() => setShowMapsDropdown(false)}
                    >
                        <button
                            type="button"
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors relative"
                            title="My Knowledge Maps"
                        >
                            <MapIcon className="h-4 w-4" />
                            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                My Knowledge Maps
                            </span>
                        </button>

                        <AnimatePresence>
                            {showMapsDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-full ml-2 top-0 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                                >
                                    {canvases.map((canvas) => (
                                        <div
                                            key={canvas.id}
                                            className={`flex items-center justify-between px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
                                                canvas.id === currentCanvasId
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                                                    : ""
                                            }`}
                                        >
                                            {editingCanvasId === canvas.id ? (
                                                <form
                                                    onSubmit={
                                                        handleCanvasNameSubmit
                                                    }
                                                    className="flex-1 flex"
                                                >
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) =>
                                                            setEditingName(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 px-1.5 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        ref={editInputRef}
                                                        onBlur={
                                                            handleCanvasNameSubmit
                                                        }
                                                    />
                                                </form>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentCanvas(
                                                                canvas.id
                                                            );
                                                            setShowMapsDropdown(
                                                                false
                                                            );
                                                        }}
                                                        className={`flex-1 text-left text-xs ${
                                                            canvas.id ===
                                                            currentCanvasId
                                                                ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                                                : "text-gray-600 dark:text-gray-300"
                                                        }`}
                                                    >
                                                        {canvas.name}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCanvasId(
                                                                canvas.id
                                                            );
                                                            setEditingName(
                                                                canvas.name
                                                            );
                                                        }}
                                                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onToggleExpanded(!isExpanded)}
                    className="sidebar-toggle-button mt-auto p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                    <ChevronRight
                        className={`h-4 w-4 transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                        }`}
                    />
                </button>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "300px", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
                    >
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                Your Knowledge Assistant
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Ask me anything about AI. I'm here to help you
                                organizing your thoughts!
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                                        className={`max-w-[85%] rounded-lg px-3 py-1.5 ${
                                            message.type === "user"
                                                ? "bg-emerald-500 text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        }`}
                                    >
                                        <p className="text-xs">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sidebar;
