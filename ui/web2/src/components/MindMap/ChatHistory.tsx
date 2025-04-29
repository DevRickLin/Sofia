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
  buttonColorClass?: string;
  messageColorClass?: string;
}

export default function ChatHistory({
  history,
  isLoading,
  onSend,
  onAddNodeFromPreview,
  buttonColorClass = "bg-sky-500 hover:bg-sky-600",
  messageColorClass = "bg-[#dbf9fe]",
}: ChatHistoryProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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
                <div className={`${messageColorClass} text-gray-900 rounded px-3 py-1.5 max-w-[80%] text-xs`}>
                  {msg.content}
                </div>
              </div>
            );
          }
          if (msg.type === "assistant-answer" && msg.cards && msg.cards.length > 0) {
            return msg.cards.map((card) => {
              if (card.type === "node" && card.nodeData) {
                // 定义 mock 数据
                const TechnicalOverviewNodeData: NodeData = {
                  title: "Technical Overview",
                  summary: "How Claude 3.5 compute use work",
                  color: "orange",
                  date: "2025-04-29",
                  organization: "Mock Org",
                  details: "",
                  keyInsights: [
                    {
                      id: "mock-insight-1",
                      content: "How it works",
                      implications: "Claude 3.5 Sonnet can operate computers by viewing screens, moving cursors, and typing input. Anthropic achieved this through general computer skills training and a GUI interaction API. Claude interprets screenshots and issues commands, which are executed in a sandboxed environment. It uses predefined tools for GUI actions and can recognize screen coordinates, allowing precise clicking—a key advancement over previous models.",
                      relatedTechnologies: [],
                      visible: true,
                    },
                    {
                      id: "mock-insight-2",
                      content: "Available Tools",
                      implications: "1. Computer tool - accepts a screenshot and a goal, and returns mouse/keyboard actions to achieve it. laude can ask to move the cursor to specific (x,y) coordinates, perform clicks, type text, and take new screenshotSaws.amazon.com\n 2. Text editor tool - allows file operations: viewing file contents, creating or editing files, replacing text, undoing changes \n3. Bash tool - a shell command interface. Claude can propose terminal commands to run for lower-level control (e.g.installing a package or running ascript)",
                      relatedTechnologies: [],
                      visible: true,
                    },
                  ],
                  
                };
                const LimitationNodeData: NodeData = {
                  title: "Limitation",
                  summary: "How Claude 3.5 compute use work",
                  color: "orange",
                  date: "2025-04-29",
                  organization: "Mock Org",
                  details: "",
                  keyInsights: [
                    {
                      id: "mock-insight-1",
                      content: "Current Limitations",
                      implications: "While promising, the feature is still in public beta and may exhibit: 1. Occasional errors or misclicks\n 2. Difficulty with dynamic or complex interfaces\n 3. Slower execution times compared to human users.",
                      relatedTechnologies: [],
                      visible: true,
                    },
                  ],
                  
                };
                return (
                  <div key={card.id} className="flex justify-start">
                    <div>
                      <BreakthroughNodePreview data={TechnicalOverviewNodeData} onAddNode={() => onAddNodeFromPreview?.(TechnicalOverviewNodeData)} />
                      <BreakthroughNodePreview data={LimitationNodeData} onAddNode={() => onAddNodeFromPreview?.(LimitationNodeData)} />
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
          className={`px-3 py-2 ${buttonColorClass} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isLoading ? "cursor-not-allowed" : "hover:shadow-md"
          }`}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
} 