import type React from "react";
import type { NodeData } from "./types";

interface BreakthroughNodePreviewProps {
  data: NodeData;
}

const BreakthroughNodePreview: React.FC<BreakthroughNodePreviewProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 w-64 shadow-sm">
      <div className="font-bold text-sky-700 text-sm mb-1">{data.title}</div>
      <div className="text-xs text-gray-600 mb-1">{data.summary}</div>
      {data.details && <div className="text-xs text-gray-400">{data.details}</div>}
      {data.date && (
        <div className="text-[10px] text-gray-400 mt-2">{data.date}</div>
      )}
    </div>
  );
};

export default BreakthroughNodePreview; 