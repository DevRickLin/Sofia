import type React from "react";
import { useState } from "react";
import type { NodeData, KeyInsight } from "./types";
import KeyInsightList from "./KeyInsightList";

interface BreakthroughNodePreviewProps {
  data: NodeData;
  onAddNode?: (data: NodeData) => void;
  isAdded?: boolean;
}

const BreakthroughNodePreview: React.FC<BreakthroughNodePreviewProps> = ({ data, onAddNode, isAdded }) => {
  const [localKeyInsights, setLocalKeyInsights] = useState<KeyInsight[]>(
    data.keyInsights ? data.keyInsights.map(ki => ({ ...ki })) : []
  );

  const handleAddKeyInsight = (insight: KeyInsight) => {
    setLocalKeyInsights(prev => prev.map(ki => ki.id === insight.id ? { ...ki, visible: true } : ki));
  };
  const handleRemoveKeyInsight = (insight: KeyInsight) => {
    setLocalKeyInsights(prev => prev.map(ki => ki.id === insight.id ? { ...ki, visible: false } : ki));
  };

  const dataWithSelectedInsights = () => ({
    ...data,
    keyInsights: localKeyInsights,
  });

  const handleClick = () => {
    if (!isAdded && onAddNode) {
      onAddNode(dataWithSelectedInsights());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isAdded && onAddNode) {
      onAddNode(dataWithSelectedInsights());
    }
  };

  return (
    <div
      className="rounded-xl border border-sky-200 bg-sky-50 p-3 w-64 shadow-sm hover:shadow-lg transition text-left relative"
      title="Click to add to canvas"
      style={{ cursor: isAdded ? "default" : "pointer" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="font-bold text-sky-700 text-sm mb-1 flex items-center justify-between">
        {data.title}
        {isAdded && <span className="ml-2 text-green-500">✔</span>}
      </div>
      <div className="text-xs text-gray-600 mb-1">{data.summary}</div>
      {data.details && <div className="text-xs text-gray-400">{data.details}</div>}
      {data.date && (
        <div className="text-[10px] text-gray-400 mt-2">{data.date}</div>
      )}
      {localKeyInsights.length > 0 && (
        <KeyInsightList
          keyInsights={localKeyInsights}
          isAdded={isAdded}
          onAddKeyInsight={(insight, e) => {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            handleAddKeyInsight(insight);
          }}
          onRemoveKeyInsight={(insight, e) => {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            handleRemoveKeyInsight(insight);
          }}
        />
      )}
    </div>
  );
};

export default BreakthroughNodePreview; 