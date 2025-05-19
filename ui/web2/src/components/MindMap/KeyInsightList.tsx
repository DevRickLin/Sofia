import React from "react";
import type { KeyInsight } from "./types";
import { Trash, PencilSimple, FloppyDisk, X } from "@phosphor-icons/react";

interface KeyInsightListProps {
  keyInsights: KeyInsight[];
  isAdded?: boolean;
  onAddKeyInsight?: (insight: KeyInsight, e?: React.MouseEvent) => void;
  onRemoveKeyInsight?: (insight: KeyInsight, e?: React.MouseEvent) => void;
  onDeleteKeyInsight?: (insight: KeyInsight) => void;
}

const KeyInsightList: React.FC<KeyInsightListProps> = ({ keyInsights, onAddKeyInsight, onRemoveKeyInsight, onDeleteKeyInsight }) => {
  const [hoveredInsightId, setHoveredInsightId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<Record<string, Partial<KeyInsight>>>({});
  const contentRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({});
  const implicationsRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({});

  React.useEffect(() => {
    if (editingId && contentRefs.current[editingId]) {
      const el = contentRefs.current[editingId];
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
    if (editingId && implicationsRefs.current[editingId]) {
      const el = implicationsRefs.current[editingId];
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editingId]);

  const handleEditClick = (insight: KeyInsight) => {
    setEditingId(insight.id);
    setEditValues((prev) => ({
      ...prev,
      [insight.id]: {
        content: insight.content,
        implications: insight.implications,
        relatedTechnologies: insight.relatedTechnologies ? [...insight.relatedTechnologies] : [],
      },
    }));
  };

  const handleEditChange = (id: string, field: keyof KeyInsight, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleTechChange = (id: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        relatedTechnologies: value.split(",").map((v) => v.trim()).filter(Boolean),
      },
    }));
  };

  const handleSave = (insight: KeyInsight) => {
    // 触发保存逻辑（此处可通过 props 回调传递给父组件）
    // 这里只是本地更新，实际项目中应有 onEditKeyInsight 回调
    if (editValues[insight.id]) {
      Object.assign(insight, editValues[insight.id]);
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-3 mt-2">
      {keyInsights.map((insight) => {
        const isEditing = editingId === insight.id;
        const editValue = editValues[insight.id] || {};
        return (
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
              {!isEditing && (
                <button
                  type="button"
                  className="p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600"
                  onClick={() => handleEditClick(insight)}
                  title="Edit"
                >
                  <PencilSimple className="h-3 w-3 flex items-center justify-center" />
                </button>
              )}
              <button
                type="button"
                className={`p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 ${
                  insight.visible ? 'opacity-50' : 'opacity-100'
                }`}
                onClick={e => onAddKeyInsight?.(insight, e)}
                title="Show in mindmap"
                disabled={isEditing}
              >
                <span className="h-3 w-3 font-bold flex items-center justify-center leading-none text-center">+</span>
              </button>
              <button
                type="button"
                className={`p-1 rounded-full bg-sky-200 hover:bg-sky-300 text-sky-600 ${
                  !insight.visible ? 'opacity-50' : 'opacity-100'
                }`}
                onClick={e => onRemoveKeyInsight?.(insight, e)}
                title="Hide from mindmap"
                disabled={isEditing}
              >
                <span className="h-3 w-3 font-bold flex items-center justify-center leading-none text-center">-</span>
              </button>
            </div>
            {onDeleteKeyInsight && !isEditing && (
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
            {/* 编辑模式 */}
            {isEditing ? (
              <div className="flex flex-col gap-2 pr-8">
                <textarea
                  ref={el => { contentRefs.current[insight.id] = el; }}
                  className="text-xs text-sky-700 font-bold bg-transparent border border-sky-200 rounded p-1 resize-none min-h-[32px] w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
                  value={editValue.content ?? insight.content}
                  onChange={e => {
                    handleEditChange(insight.id, 'content', e.target.value);
                    const el = contentRefs.current[insight.id];
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  placeholder="内容"
                  style={{ minHeight: 32, width: '100%', boxSizing: 'border-box' }}
                />
                <textarea
                  ref={el => { implicationsRefs.current[insight.id] = el; }}
                  className="mt-1 text-xs text-sky-600 italic bg-transparent border border-sky-100 rounded p-1 resize-none min-h-[24px] w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                  value={editValue.implications ?? insight.implications}
                  onChange={e => {
                    handleEditChange(insight.id, 'implications', e.target.value);
                    const el = implicationsRefs.current[insight.id];
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  placeholder="影响/启示"
                  style={{ minHeight: 24, width: '100%', boxSizing: 'border-box' }}
                />
                <input
                  className="mt-1 text-[10px] px-1.5 py-0.5 rounded-full border border-sky-100 text-sky-700 bg-transparent h-7 focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                  value={(editValue.relatedTechnologies || insight.relatedTechnologies || []).join(', ')}
                  onChange={e => handleTechChange(insight.id, e.target.value)}
                  placeholder="相关技术（逗号分隔）"
                  style={{ fontSize: 10, width: '100%', boxSizing: 'border-box' }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-sky-500 text-white text-xs hover:bg-sky-600"
                    onClick={() => handleSave(insight)}
                  >
                    <FloppyDisk className="h-3 w-3" /> Save
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300"
                    onClick={handleCancel}
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
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
            )}
            {/* Visible status */}
            {insight.visible && !isEditing && (
              <div className="mt-1 text-[10px] text-sky-600 font-medium flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1" />
                Visible in mindmap
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KeyInsightList; 