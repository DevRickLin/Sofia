import React from "react";
import type { KeyInsight } from "./types";
import { Trash } from "@phosphor-icons/react";

interface KeyInsightListProps {
  keyInsights: KeyInsight[];
  isAdded?: boolean;
  onAddKeyInsight?: (insight: KeyInsight, e?: React.MouseEvent) => void;
  onRemoveKeyInsight?: (insight: KeyInsight, e?: React.MouseEvent) => void;
  onDeleteKeyInsight?: (insight: KeyInsight) => void;
}

const KeyInsightList: React.FC<KeyInsightListProps> = ({ keyInsights, onAddKeyInsight, onRemoveKeyInsight, onDeleteKeyInsight }) => {
  const [hoveredInsightId, setHoveredInsightId] = React.useState<string | null>(null);

  return (
    <div className="space-y-3 mt-2">
      {keyInsights.map((insight) => (
        <div
          key={insight.id}
          className={`relative rounded p-2 ${
            insight.visible 
              ? "bg-sky-100 border-l-2 border-sky-500" 
              : "bg-sky-50"
          }`}
          onMouseEnter={() => setHoveredInsightId(insight.id)}
          onMouseLeave={() => setHoveredInsightId(null)}
        >
          {/* Control buttons */}
          <div 
            className="absolute right-2 top-2 z-10 flex flex-col gap-1"
            style={{ 
              opacity: hoveredInsightId === insight.id ? 1 : 0, 
              transition: 'opacity 0.15s ease-in-out' 
            }}
          >
            <button
              type="button"
              className={`p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 ${
                insight.visible ? 'opacity-50' : 'opacity-100'
              }`}
              onClick={e => onAddKeyInsight?.(insight, e)}
              title="Show in mindmap"
            >
              <span className="h-3 w-3 font-bold flex items-center justify-center">+</span>
            </button>
            <button
              type="button"
              className={`p-1 rounded-full bg-sky-200 hover:bg-sky-300 text-sky-600 ${
                !insight.visible ? 'opacity-50' : 'opacity-100'
              }`}
              onClick={e => onRemoveKeyInsight?.(insight, e)}
              title="Hide from mindmap"
            >
              <span className="h-3 w-3 font-bold flex items-center justify-center">-</span>
            </button>
          </div>
          {onDeleteKeyInsight && (
            <button
              type="button"
              className="absolute right-2 bottom-2 p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 z-10"
              style={{ opacity: hoveredInsightId === insight.id ? 1 : 0, transition: 'opacity 0.15s ease-in-out' }}
              onClick={() => onDeleteKeyInsight(insight)}
              title="Delete insight"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
          
          {/* Content */}
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-8">
              <p className="text-xs text-sky-700 font-bold">
                {insight.content}
              </p>
              {insight.implications && (
                <p className="mt-1 text-xs text-sky-600 italic">
                  {insight.implications}
                </p>
              )}
              {insight.relatedTechnologies && insight.relatedTechnologies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {insight.relatedTechnologies.map((tech) => (
                    <span 
                      key={tech} 
                      className="inline-block bg-sky-100 text-[10px] px-1.5 py-0.5 rounded-full text-sky-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Visible status */}
          {insight.visible && (
            <div className="mt-1 text-[10px] text-sky-600 font-medium flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1" />
              Visible in mindmap
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KeyInsightList; 