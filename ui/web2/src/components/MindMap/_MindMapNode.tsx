import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';

interface NodeData {
    label?: string;
    title?: string;
    description?: string;
    summary?: string;
    details?: string;
}

const MindMapNode = ({ data }: { data: NodeData }) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isHighlighted, setIsHighlighted] = useState(false);
    
    useEffect(() => {
        const handleFocusNode = (event: CustomEvent) => {
            const { searchQuery } = event.detail;
            if (!nodeRef.current || !searchQuery) return;

            const nodeText = (data.title || data.label || '').toLowerCase() + ' ' + 
                           (data.description || '').toLowerCase();
            
            if (nodeText.includes(searchQuery.toLowerCase())) {
                setSearchTerm(searchQuery);
                setIsHighlighted(true);
                
                // Remove highlight after animation
                setTimeout(() => {
                    setIsHighlighted(false);
                }, 2000);
            }
        };

        window.addEventListener('focusNode' as any, handleFocusNode);
        return () => {
            window.removeEventListener('focusNode' as any, handleFocusNode);
        };
    }, [data]);

    const highlightText = (text: string) => {
        if (!text || !searchTerm) return text;
        
        const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() ? 
                <span key={i} className="bg-yellow-200 dark:bg-yellow-500/50">{part}</span> : 
                part
        );
    };

    return (
        <div 
            ref={nodeRef} 
            className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300
                ${isHighlighted ? 'ring-4 ring-yellow-400 dark:ring-yellow-500/50 animate-pulse-gentle' : ''}`}
        >
            <Handle type="target" position={Position.Top} className="w-3 h-3" />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
            
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {highlightText(data.title || data.label || '')}
            </div>
            
            {data.description && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {highlightText(data.description)}
                </div>
            )}
        </div>
    );
};

export default MindMapNode; 