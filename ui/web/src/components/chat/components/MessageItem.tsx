import type React from 'react';
import type { Message, TextPart, FilePart, DataPart } from '../../../types/chat';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAgent = message.role === 'agent';
  
  const renderPart = (part: TextPart | FilePart | DataPart, index: number) => {
    switch (part.type) {
      case 'text':
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.content}
          </div>
        );
        
      case 'file':
        return (
          <div key={index} className="mt-2 p-2 bg-secondary-100 dark:bg-secondary-700 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary-500 dark:text-secondary-400">
              <title>File Icon</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            <span className="ml-2 text-sm">
              {part.filename || 'Attached file'} ({part.mimeType})
            </span>
          </div>
        );
        
      case 'data':
        return (
          <div key={index} className="mt-2 p-3 bg-secondary-100 dark:bg-secondary-700 rounded-md">
            <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-1">
              Structured Data
            </div>
            <pre className="text-xs overflow-auto p-2 bg-white dark:bg-secondary-800 rounded border border-secondary-200 dark:border-secondary-600">
              {JSON.stringify(part.data, null, 2)}
            </pre>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();

  return (
    <div 
      className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
    >
      <div 
        className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
          isAgent 
            ? 'bg-white dark:bg-secondary-800' 
            : 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
        }`}
      >
        {message.parts.map((part, idx) => {
          if (part.type === 'text') {
            return (
              <div key={`${message.timestamp}-${idx}`} className="text-sm">
                {part.content}
              </div>
            );
          }
          return null;
        })}
        <div className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default MessageItem; 