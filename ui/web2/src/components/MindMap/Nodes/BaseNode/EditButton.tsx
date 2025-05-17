import React from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import { LabeledIcon } from './LabeledIcon';

interface EditButtonProps {
  onEdit: (event: React.MouseEvent) => void;
  showTooltip: () => void;
  hideTooltip: () => void;
}

export const EditButton: React.FC<EditButtonProps> = ({ 
  onEdit,
  showTooltip,
  hideTooltip
}) => {
  return (
    <LabeledIcon
      icon={<PencilSimple className="text-gray-400 hover:text-blue-600" />}
      label="Edit"
      forceVisible={false}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onEdit(event);
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    />
  );
}; 