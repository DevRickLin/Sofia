import type React from 'react';
import { memo } from 'react';
import { type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import type { EdgeData } from '../../../types/canvas';

const RelationshipEdge: React.FC<EdgeProps<EdgeData>> = ({ 
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd
}) => {
  const edgePath = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationshipType = data?.type || 'relates to';
  const edgeLabel = data?.label || relationshipType;

  return (
    <>
      <path
        id={id}
        className={`stroke-2 ${selected 
          ? 'stroke-primary-500' 
          : 'stroke-secondary-400'
        } fill-none`}
        d={edgePath[0]}
        markerEnd={markerEnd}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
            pointerEvents: 'all',
          }}
          className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${selected 
              ? 'bg-primary-100 text-primary-800 border border-primary-300' 
              : 'bg-white text-secondary-700 border border-secondary-200 dark:bg-secondary-800 dark:text-secondary-200 dark:border-secondary-700'
            }
            shadow-sm transition-colors duration-200
          `}
        >
          {edgeLabel}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RelationshipEdge); 