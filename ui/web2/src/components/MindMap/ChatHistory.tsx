import React from "react";
import { PaperPlaneTilt as Send, Spinner as Loader2 } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../services/mock2";
import BreakthroughNodePreview from "./BreakthroughNodePreview";
import type { NodeData } from "./types";

interface ChatHistoryProps {
  history: ChatMessage[];
  isLoading: boolean;
  onSend: (question: string) => void;
  onAddNodeFromPreview?: (data: NodeData) => void;
}

export default function ChatHistory({
  history,
  isLoading,
  onSend,
  onAddNodeFromPreview,
}: ChatHistoryProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {history.map((msg) => {
          if (msg.type === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-[#dbf9fe] text-gray-900 rounded px-3 py-1.5 max-w-[80%] text-xs">
                  {msg.content}
                </div>
              </div>
            );
          }
          if (msg.type === "assistant-answer" && msg.cards && msg.cards.length > 0) {
            return msg.cards.map((card) => {
              if (card.type === "node" && card.nodeData) {
                return (
                  <div key={card.id} className="flex justify-start">
                    <div>
                      <BreakthroughNodePreview data={card.nodeData} onAddNode={onAddNodeFromPreview} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={card.id} className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded px-3 py-1.5 max-w-[80%] text-xs">
                    <strong>{card.title}</strong>
                    <div>{card.content}</div>
                  </div>
                </div>
              );
            });
          }
          // AI text
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded px-3 py-1.5 max-w-[80%] text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded px-3 py-1.5">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="flex-1 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
        />
        <button
          type="submit"
          className={`px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isLoading ? "cursor-not-allowed" : "hover:bg-sky-600 hover:shadow-md"
          }`}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
} 