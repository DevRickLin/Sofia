import type React from "react";
import type { KeyInsight } from "./types";

interface KeyInsightListProps {
  keyInsights: KeyInsight[];
  isAdded?: boolean;
  onAddKeyInsight?: (insight: KeyInsight, e: React.MouseEvent) => void;
  onRemoveKeyInsight?: (insight: KeyInsight, e: React.MouseEvent) => void;
}

const KeyInsightList: React.FC<KeyInsightListProps> = ({ keyInsights, onAddKeyInsight, onRemoveKeyInsight }) => {
  return (
    <div className="space-y-3 mt-2">
      {keyInsights.map((insight) => (
        <div
          key={insight.id}
          className="relative rounded-lg p-3 bg-blue-50 border border-blue-200 shadow-sm flex flex-col"
        >
          {/* + / - 按钮 */}
          <div className="absolute top-2 right-2 flex gap-1">
            {insight.visible ? (
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold hover:bg-blue-300 disabled:opacity-50"
                onClick={e => onRemoveKeyInsight?.(insight, e)}
                title="Remove this insight"
              >
                -
              </button>
            ) : (
              <button
                type="button"
                className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold hover:bg-blue-200 disabled:opacity-50"
                onClick={e => onAddKeyInsight?.(insight, e)}
                title="Add this insight"
              >
                +
              </button>
            )}
          </div>
          {/* 内容 */}
          <div className="font-bold text-blue-900 text-sm mb-1">{insight.content}</div>
          {insight.implications && (
            <div className="italic text-xs text-blue-800 mb-1">{insight.implications}</div>
          )}
          {insight.relatedTechnologies && insight.relatedTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-blue-700 mb-1">
              {insight.relatedTechnologies.map((tech) => (
                <span key={tech} className="bg-blue-100 rounded px-2 py-0.5">{tech}</span>
              ))}
            </div>
          )}
          {/* Visible 状态 */}
          {insight.visible && (
            <div className="flex items-center text-xs text-blue-700 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1" />
              Visible in mindmap
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KeyInsightList; 