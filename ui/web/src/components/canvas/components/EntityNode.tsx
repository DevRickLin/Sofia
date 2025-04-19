import type React from 'react';
import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeData } from '../../../types/canvas';

const EntityNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  // Extract and format the properties to display
  const displayProperties = Object.entries(data.properties || {})
    .slice(0, 3) // Show only first 3 properties to avoid clutter
    .map(([key, value]) => ({ key, value: String(value) }));
  
  const hasMoreProperties = Object.keys(data.properties || {}).length > 3;

  return (
    <div 
      className={`
        rounded-lg border-2 shadow-md w-64 
        ${selected 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900' 
          : 'border-secondary-300 bg-white dark:bg-secondary-800'
        }
        transition-colors duration-200
      `}
    >
      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-primary-500 bg-white"
      />
      
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-primary-500 bg-white"
      />
      
      {/* Header */}
      <div className={`
        px-4 py-2 font-semibold text-white rounded-t-md
        ${selected 
          ? 'bg-primary-600' 
          : 'bg-secondary-600'
        }
      `}>
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wider">{data.type}</span>
          <span className="text-xs opacity-75">ID: {data.id && typeof data.id === 'string' ? data.id.substring(0, 6) : ''}</span>
        </div>
      </div>
      
      {/* Body - Label */}
      <div className="px-4 py-3 text-lg font-medium border-b dark:border-secondary-700">
        {data.label}
      </div>
      
      {/* Body - Properties */}
      <div className="px-4 py-2 text-sm">
        {displayProperties.length > 0 ? (
          <div className="space-y-1">
            {displayProperties.map(({ key, value }) => (
              <div key={key} className="flex justify-between">
                <span className="text-secondary-500 dark:text-secondary-400">{key}:</span>
                <span className="font-medium truncate max-w-[150px]">{value}</span>
              </div>
            ))}
            
            {hasMoreProperties && (
              <div className="text-xs text-center mt-2 text-secondary-500">
                + {Object.keys(data.properties || {}).length - 3} more properties
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-secondary-500 py-1">No properties</div>
        )}
      </div>
    </div>
  );
};

export default memo(EntityNode); 