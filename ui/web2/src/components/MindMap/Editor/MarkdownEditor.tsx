import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  preview?: 'edit' | 'preview' | 'live';
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialValue,
  onChange,
  placeholder = 'Enter markdown content...',
  height = 300,
  preview = 'live'
}) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (val: string | undefined) => {
    const newValue = val || '';
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview={preview}
        textareaProps={{
          placeholder
        }}
      />
    </div>
  );
}; 