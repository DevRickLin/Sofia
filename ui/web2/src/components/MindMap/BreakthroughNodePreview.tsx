import type React from "react";
import type { NodeData } from "./types";

interface BreakthroughNodePreviewProps {
  data: NodeData;
  onAddNode?: (data: NodeData) => void;
}

const BreakthroughNodePreview: React.FC<BreakthroughNodePreviewProps> = ({ data, onAddNode }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      onAddNode?.(data);
    }
  };
  return (
    <button
      type="button"
      className="rounded-xl border border-sky-200 bg-sky-50 p-3 w-64 shadow-sm cursor-pointer hover:shadow-lg transition text-left"
      onClick={() => onAddNode?.(data)}
      onKeyDown={handleKeyDown}
      title="点击添加到画布"
    >
      <div className="font-bold text-sky-700 text-sm mb-1">{data.title}</div>
      <div className="text-xs text-gray-600 mb-1">{data.summary}</div>
      {data.details && <div className="text-xs text-gray-400">{data.details}</div>}
      {data.date && (
        <div className="text-[10px] text-gray-400 mt-2">{data.date}</div>
      )}
    </button>
  );
};

export default BreakthroughNodePreview; 