import React, { useState, useEffect, useCallback } from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import type { KeyInsight, NodeData } from '../types';
import { Portal } from './Portal';

interface NodeEditModalProps {
  nodeData: NodeData;
  onSave: (updatedData: Partial<NodeData>) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  nodeData,
  onSave,
  onClose,
  isOpen
}) => {
  const [title, setTitle] = useState(nodeData.title || '');
  const [summary, setSummary] = useState(nodeData.summary || '');
  const [details, setDetails] = useState(nodeData.details || '');
  const [modalWidth, setModalWidth] = useState('75%');
  
  // 存储编辑中的keyInsights
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>(
    nodeData.keyInsights || []
  );
  
  // 当前正在编辑的keyInsight索引
  const [editingInsightIndex, setEditingInsightIndex] = useState<number | null>(null);
  
  // 计算可见区域的宽度并设置弹窗宽度
  const updateModalWidth = useCallback(() => {
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 640) {
      setModalWidth('95%');
    } else if (viewportWidth < 1024) {
      setModalWidth('85%');
    } else {
      setModalWidth('75%');
    }
  }, []);
  
  useEffect(() => {
    // 初始化弹窗宽度
    updateModalWidth();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateModalWidth);
    
    // 添加ESC键关闭弹窗功能
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    // 阻止滚动
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('resize', updateModalWidth);
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [onClose, updateModalWidth]);
  
  // 更新特定的keyInsight
  const updateKeyInsight = (index: number, field: keyof KeyInsight, value: string) => {
    const updatedInsights = [...keyInsights];
    updatedInsights[index] = {
      ...updatedInsights[index],
      [field]: value
    };
    setKeyInsights(updatedInsights);
  };

  const handleSave = () => {
    onSave({
      title,
      summary,
      details,
      keyInsights
    });
    onClose();
  };

  // 阻止点击冒泡到背景层
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // 键盘事件处理函数
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] transition-opacity duration-300"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div 
          style={{ width: modalWidth, maxWidth: '1200px' }}
          className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-in-out transform"
          onClick={handleContentClick}
          onKeyDown={(e) => e.stopPropagation()}
          role="document"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-2xl font-bold text-black">Edit Node</h2>
            <button 
              type="button"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClose();
                }
              }}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="node-title" className="block text-sm font-medium text-gray-900 mb-1">Title</label>
                <input
                  id="node-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="node-summary" className="block text-sm font-medium text-gray-900 mb-1">Summary</label>
                <div id="node-summary">
                  <MarkdownEditor
                    initialValue={summary}
                    onChange={setSummary}
                    height={150}
                    placeholder="Enter node summary..."
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="node-details" className="block text-sm font-medium text-gray-900 mb-1">Details</label>
                <div id="node-details">
                  <MarkdownEditor
                    initialValue={details}
                    onChange={setDetails}
                    height={200}
                    placeholder="Enter node details..."
                  />
                </div>
              </div>
              
              {/* Key Insights Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label id="insights-label" className="block text-sm font-medium text-gray-900">Key Insights</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setKeyInsights([
                        ...keyInsights, 
                        { id: crypto.randomUUID(), content: '', implications: '', visible: true }
                      ]);
                      setEditingInsightIndex(keyInsights.length);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setKeyInsights([
                          ...keyInsights, 
                          { id: crypto.randomUUID(), content: '', implications: '', visible: true }
                        ]);
                        setEditingInsightIndex(keyInsights.length);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
                  >
                    Add Insight
                  </button>
                </div>
                
                <div className="space-y-4" aria-labelledby="insights-label">
                  {keyInsights.map((insight, index) => (
                    <div key={insight.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-gray-50">
                        <span className="font-medium text-gray-900">Insight {index + 1}</span>
                        <div className="flex space-x-2">
                          <button 
                            type="button"
                            onClick={() => setEditingInsightIndex(index === editingInsightIndex ? null : index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setEditingInsightIndex(index === editingInsightIndex ? null : index);
                              }
                            }}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm transition-colors"
                          >
                            {index === editingInsightIndex ? 'Collapse' : 'Edit'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setKeyInsights(keyInsights.filter((_, i) => i !== index))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setKeyInsights(keyInsights.filter((_, i) => i !== index));
                              }
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {index === editingInsightIndex ? (
                        <div className="p-4 space-y-4 bg-white">
                          <div>
                            <label htmlFor={`insight-content-${index}`} className="block text-sm font-medium text-gray-900 mb-1">Content</label>
                            <div id={`insight-content-${index}`}>
                              <MarkdownEditor
                                initialValue={insight.content}
                                onChange={(value) => updateKeyInsight(index, 'content', value)}
                                height={120}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor={`insight-implications-${index}`} className="block text-sm font-medium text-gray-900 mb-1">Implications</label>
                            <div id={`insight-implications-${index}`}>
                              <MarkdownEditor
                                initialValue={insight.implications}
                                onChange={(value) => updateKeyInsight(index, 'implications', value)}
                                height={120}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white">
                          <div className="text-sm text-gray-800 overflow-hidden text-ellipsis">
                            {insight.content ? (
                              <div className="prose max-w-none line-clamp-2">
                                {insight.content.substring(0, 120)}{insight.content.length > 120 ? '...' : ''}
                              </div>
                            ) : (
                              <em className="text-gray-500">No content</em>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {keyInsights.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-600">No key insights yet</p>
                      <p className="text-sm text-gray-500 mt-1">Click the 'Add Insight' button to create new insights</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部操作区 */}
          <div className="flex justify-end items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onClose();
                }
              }}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSave();
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}; 