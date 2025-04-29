import React from "react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Plus,
    MapTrifold as MapIcon,
    Stack as Layers,
    CaretRight as ChevronRight,
    PencilSimpleLine as Edit2,
    MagnifyingGlass as Search,
    X,
    Lightbulb,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "../../store/canvasStore";
import type { A2AClient } from 'a2a-client';
import { generateChatResponse } from "../../services/mock";
import { generateFreeNodeChatResponse } from "../../services/mock3";
import ChatHistory from "./ChatHistory";
import type { ChatMessage } from "../../services/mock2";
import type { NodeData as MindMapNodeData } from "./types";

interface SidebarProps {
    onAddNode: () => void;
    onNewCanvas: () => void;
    isExpanded: boolean;
    onToggleExpanded: (expanded: boolean) => void;
    onAddNodeFromPreview?: (data: MindMapNodeData) => void;
    chatHistories: Record<string, ChatMessage[]>;
    setChatHistories: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
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

// 定义通用的 Markdown 组件配置
const markdownComponents: Components = {
    // 自定义列表项的样式
    li: ({...props}) => <li className="my-0" {...props} />,
    // 自定义段落样式
    p: ({...props}) => <p className="my-1" {...props} />,
    // 自定义标题样式
    h1: ({...props}) => <h1 className="text-sm font-bold my-1" {...props} />,
    h2: ({...props}) => <h2 className="text-xs font-bold my-1" {...props} />,
    h3: ({...props}) => <h3 className="text-xs font-semibold my-0.5" {...props} />,
    // 自定义代码块样式
    code: ({className, children, ...props}) => {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && (className || '').indexOf('inline') !== -1;
        return isInline 
            ? <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[0.9em]" {...props}>{children}</code>
            : <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-[0.9em]" {...props}>{children}</code>;
    },
    // 增强表格样式
    table: ({...props}) => (
        <div className="overflow-x-auto my-2">
            <table className="border-collapse border border-gray-300 dark:border-gray-700 text-[0.9em]" {...props} />
        </div>
    ),
    th: ({...props}) => <th className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-1" {...props} />,
    td: ({...props}) => <td className="border border-gray-300 dark:border-gray-700 px-2 py-1" {...props} />
};

const Sidebar: React.FC<SidebarProps> = ({
    onAddNode,
    onNewCanvas,
    isExpanded,
    onToggleExpanded,
    onAddNodeFromPreview,
    chatHistories,
    setChatHistories,
}) => {
    const [showMapsDropdown, setShowMapsDropdown] = useState(false);
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

    // 当前画布的 chatHistory
    const chatHistory = currentCanvas ? chatHistories[currentCanvas.id] || [] : [];
    // 记录上一次 chatHistory 长度
    const chatHistoryRef = React.useRef<ChatMessage[]>([]);
    React.useEffect(() => {
        chatHistoryRef.current = chatHistory;
    }, [chatHistory]);

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

    const handleCanvasNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCanvasId && editingName.trim()) {
            updateCanvasName(editingCanvasId, editingName.trim());
            setEditingCanvasId(null);
            setEditingName("");
        }
    };

    // 处理对话逻辑
    const handleChat = async (userQuestion: string) => {
        if (!currentCanvas) return;

        setIsLoading(true);
        try {
            // 准备画布数据
            const canvasData = {
                ...currentCanvas,
                title: currentCanvas.name,
                description: `This is a mind map called "${currentCanvas.name}"`,
            };

            // 添加用户消息到历史记录
            setChatHistories((prev) => ({
                ...prev,
                [currentCanvas.id]: [
                    ...(prev[currentCanvas.id] || []),
                    {
                        type: "user",
                        content: userQuestion,
                        id: `user-${Date.now()}`,
                    },
                ],
            }));

            const isFreeNode = typeof window !== 'undefined' && (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode;

            if (isFreeNode) {
                // 使用 mock3 的实现
                const result = await generateFreeNodeChatResponse(
                    canvasData,
                    userQuestion,
                    (history) => {
                        setChatHistories((prev) => ({
                            ...prev,
                            [currentCanvas.id]:
                                typeof history === "function"
                                    ? history(prev[currentCanvas.id] || [])
                                    : history,
                        }));
                    }
                );

                // 如果返回了替换节点的信号，处理节点替换
                if (result?.type === 'replace-node' && result.nodeData && onAddNodeFromPreview) {
                    onAddNodeFromPreview(result.nodeData);
                    // 清除 freeNode 标记
                    if (typeof window !== 'undefined') {
                        (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode = false;
                    }
                }
            } else {
                // 添加思考中的消息
                const thinkingId = `thinking-${Date.now()}`;
                setChatHistories((prev) => ({
                    ...prev,
                    [currentCanvas.id]: [
                        ...(prev[currentCanvas.id] || []),
                        {
                            type: "assistant-thinking",
                            content: "Thinking...",
                            id: thinkingId,
                        },
                    ],
                }));

                // 使用 mock 的实现
                const response = await generateChatResponse(
                    {} as A2AClient,
                    canvasData,
                    userQuestion
                );

                // 移除思考中的消息
                setChatHistories((prev) => ({
                    ...prev,
                    [currentCanvas.id]: prev[currentCanvas.id].filter(msg => msg.id !== thinkingId)
                }));

                // 根据响应类型处理
                if (response.type === 'mindmap') {
                    // 添加 AI 的回复到聊天历史
                    setChatHistories((prev) => ({
                        ...prev,
                        [currentCanvas.id]: [
                            ...(prev[currentCanvas.id] || []),
                            {
                                type: "assistant-answer",
                                content: response.content,
                                id: `assistant-${Date.now()}`,
                            } as ChatMessage,
                        ],
                    }));
                    
                    // 延迟3000ms后初始化思维导图
                    setTimeout(() => {
                        // 初始化默认的 mindmap 数据
                        useCanvasStore.getState().initDefault();
                    }, 3000);
                } else {
                    // 添加 AI 的回复到聊天历史
                    setChatHistories((prev) => ({
                        ...prev,
                        [currentCanvas.id]: [
                            ...(prev[currentCanvas.id] || []),
                            {
                                type: "assistant-answer",
                                content: response.content,
                                id: `assistant-${Date.now()}`,
                            } as ChatMessage,
                        ],
                    }));
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (currentCanvas) {
                setChatHistories((prev) => ({
                    ...prev,
                    [currentCanvas.id]: [
                        ...(prev[currentCanvas.id] || []),
                        {
                            type: "assistant-answer",
                            content:
                                "I apologize, but I encountered an error while processing your request.",
                            id: `error-${Date.now()}`,
                        },
                    ],
                }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 展开 sidebar 时重置 freeNode 标记
    useEffect(() => {
        if (isExpanded && typeof window !== 'undefined' && (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode) {
            setTimeout(() => {
                (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode = false;
            }, 0);
        }
    }, [isExpanded]);

    return (
        <div className="flex h-full" ref={sidebarRef}>
            <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-3 shadow-sm">
                <div className="flex flex-col items-center space-y-3">
                    <button
                        type="button"
                        onClick={onAddNode}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors group relative"
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
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors group relative"
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
                                    className="absolute left-full top-0 ml-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
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
                                                className="w-full px-3 py-1.5 pl-8 pr-8 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                                                    className="absolute right-2 top-1.5 p-0.5 rounded-full hover:bg-gray-100"
                                                >
                                                    <X className="h-3 w-3 text-gray-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="max-h-64 overflow-y-auto border-t border-gray-200">
                                            {searchResults.map((result) => (
                                                <button
                                                    type="button"
                                                    key={result.id}
                                                    onClick={() => {
                                                        handleSearchResultClick(result.id);
                                                        setShowSearch(false);
                                                    }}
                                                    className="w-full text-left p-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="text-xs font-medium text-gray-900">
                                                        {result.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 line-clamp-2 prose prose-sm dark:prose-invert max-w-none markdown-content">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={markdownComponents}
                                                        >
                                                            {result.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && searchResults.length === 0 && (
                                        <div className="p-2 text-xs text-gray-500 text-center border-t border-gray-200">
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setShowSearch(false);
                                        setSearchQuery("");
                                        setSearchResults([]);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onNewCanvas}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors group relative"
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
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors relative"
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
                                    className="absolute left-full ml-2 top-0 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                                >
                                    {canvases.map((canvas) => (
                                        <div
                                            key={canvas.id}
                                            className={`flex items-center justify-between px-2 py-1 hover:bg-gray-100 ${
                                                canvas.id === currentCanvasId
                                                    ? "bg-emerald-50"
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
                                                                ? "text-emerald-700 font-medium"
                                                                : "text-gray-600"
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
                                                        className="p-0.5 text-gray-400 hover:text-gray-600"
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
                    className="sidebar-toggle-button mt-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
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
                        className="bg-white border-r border-gray-200 flex flex-col"
                    >
                        {typeof window !== 'undefined' && (window as Window & { __fromFreeNode?: boolean }).__fromFreeNode && (
                            <div className="p-4 border-b border-emerald-200 bg-emerald-50">
                                <div className="text-emerald-700 text-sm font-semibold mb-1">Welcome!</div>
                                <div className="text-xs text-emerald-800">You just created a free node. Start your exploration by asking a question or adding insights!</div>
                            </div>
                        )}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100">
                                    <Lightbulb 
                                        weight="bold"
                                        className="h-3.5 w-3.5 text-emerald-600" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xs font-semibold text-gray-900">
                                        Your Insight Map Assistant
                                    </h3>
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                        Ask me to create insight maps about any topic in AI
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {currentCanvas && (
                                <ChatHistory
                                    history={chatHistory}
                                    isLoading={isLoading}
                                    onSend={handleChat}
                                    onAddNodeFromPreview={onAddNodeFromPreview}
                                    buttonColorClass="bg-emerald-500 hover:bg-emerald-600"
                                    messageColorClass="bg-emerald-50"
                                />
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            {/* Chat input is now handled by ChatHistory */}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sidebar;
